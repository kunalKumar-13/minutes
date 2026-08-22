"""Sign-in, sign-out and session inspection.

Scope note: the assignment lists real authentication as a placeholder, so there
is no credential check here — choosing a provider on the login screen signs you
in as the workspace's default user. Everything downstream of that is real: a
session row is issued with a token and an expiry, requests carrying
``Authorization: Bearer <token>`` resolve through it, and revoking a session
logs that browser out. Making it real means replacing `create_session`'s
identity lookup, and nothing else.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from .. import models, schemas
from ..database import get_db
from ..deps import DEFAULT_USER_EMAIL, get_current_user, resolve_session

router = APIRouter(prefix="/auth", tags=["auth"])

SESSION_TTL = timedelta(days=30)
PROVIDERS = {"google", "microsoft", "sso", "demo"}


@router.post("/session", response_model=schemas.LoginResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: schemas.LoginRequest,
    request: Request,
    db: OrmSession = Depends(get_db),
) -> schemas.LoginResponse:
    """Sign in and receive a session token."""
    if payload.provider not in PROVIDERS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown provider '{payload.provider}'.")

    user = db.scalars(select(models.User).where(models.User.email == DEFAULT_USER_EMAIL)).first()
    if user is None:
        user = db.scalars(select(models.User).order_by(models.User.created_at)).first()
    if user is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Workspace has not been seeded yet.")

    session = models.Session(
        user_id=user.id,
        provider=payload.provider,
        user_agent=request.headers.get("user-agent", "")[:400] or None,
        expires_at=(datetime.now(timezone.utc) + SESSION_TTL).replace(tzinfo=None),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return schemas.LoginResponse(
        token=session.id,
        expires_at=session.expires_at,
        provider=session.provider,
        user=schemas.UserOut.model_validate(user),
    )


@router.get("/session", response_model=schemas.SessionOut)
def read_session(
    db: OrmSession = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> schemas.SessionOut:
    """Who this token belongs to, and whether it is still valid."""
    session = resolve_session(db, authorization)
    if session is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "That session is not valid.")
    return schemas.SessionOut(
        id=session.id,
        provider=session.provider,
        created_at=session.created_at,
        last_seen_at=session.last_seen_at,
        expires_at=session.expires_at,
        user=schemas.UserOut.model_validate(session.user),
    )


@router.delete("/session", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def revoke_session(
    db: OrmSession = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> None:
    """Sign out. Idempotent — signing out twice is not an error."""
    session = resolve_session(db, authorization)
    if session is not None:
        session.revoked_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()


@router.get("/sessions", response_model=list[schemas.SessionOut])
def list_sessions(
    db: OrmSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> list[schemas.SessionOut]:
    """Active sessions for the current user — shown on the Settings page."""
    rows = db.scalars(
        select(models.Session)
        .where(models.Session.user_id == user.id, models.Session.revoked_at.is_(None))
        .order_by(models.Session.last_seen_at.desc())
    ).all()
    return [
        schemas.SessionOut(
            id=row.id,
            provider=row.provider,
            created_at=row.created_at,
            last_seen_at=row.last_seen_at,
            expires_at=row.expires_at,
            user=schemas.UserOut.model_validate(row.user),
        )
        for row in rows
        if row.is_active
    ]
