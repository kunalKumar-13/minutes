"""Shared FastAPI dependencies."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from . import models
from .database import get_db

DEFAULT_USER_EMAIL = "kunal@fireflies.dev"


def resolve_session(db: Session, authorization: str | None) -> models.Session | None:
    """Look up an `Authorization: Bearer <token>` header, or return None.

    Touching `last_seen_at` here is what makes the Settings page's session list
    meaningful — it is the only place that knows a token was just used.
    """
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None

    session = db.get(models.Session, token.strip())
    if session is None or not session.is_active:
        return None

    session.last_seen_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.commit()
    return session


def get_current_user(
    db: Session = Depends(get_db),
    authorization: str | None = Header(default=None),
) -> models.User:
    """The signed-in user.

    Two paths, deliberately:

    * A valid session token resolves to that session's user. This is the real
      path, and it is what the browser always uses.
    * No token falls back to the workspace's default owner. The assignment
      scopes authentication as a placeholder, and this keeps `/docs`, curl and
      the seeding CLI usable without a login dance.

    Either way, routers only ever ask for `current_user` — none of them reach
    for "the first row in users". Deleting the fallback is the entire change
    required to make this app properly authenticated.
    """
    session = resolve_session(db, authorization)
    if session is not None:
        return session.user

    user = db.query(models.User).filter(models.User.email == DEFAULT_USER_EMAIL).first()
    if user is None:
        user = db.query(models.User).order_by(models.User.created_at).first()
    if user is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Workspace has not been seeded yet.")
    return user


def get_meeting(meeting_id: str, db: Session = Depends(get_db)) -> models.Meeting:
    meeting = db.get(models.Meeting, meeting_id)
    if meeting is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Meeting not found.")
    return meeting
