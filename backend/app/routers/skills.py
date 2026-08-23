"""AI Skills — the catalogue, the user's saved skills, and the run Feed.

Ownership
---------
Every query in this module is scoped by `current_user`. A skill is a prompt
someone wrote and a run is the output of their meeting, so there is no read
path here that is allowed to reach across users. `_owned_skill` is the single
place that enforces it, and every handler goes through it.
"""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..services import skills as skills_service

router = APIRouter(tags=["ai skills"])


# --------------------------------------------------------------------------- helpers
def _owned_skill(skill_id: str, db: Session, user: models.User) -> models.Skill:
    """Fetch a skill the caller owns, or 404.

    Deliberately 404 and not 403: telling a stranger that a skill id exists but
    belongs to someone else is itself a leak.
    """
    skill = db.get(models.Skill, skill_id)
    if skill is None or skill.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Skill not found.")
    return skill


def _skill_out(skill: models.Skill) -> schemas.SkillOut:
    runs = skill.runs
    return schemas.SkillOut(
        **{c: getattr(skill, c) for c in (
            "id", "name", "description", "category", "instructions", "schedule", "output_type",
            "scope", "filter_title", "filter_host", "filter_participant", "is_enabled",
            "template_key", "tint", "created_at", "updated_at",
        )},
        run_count=len(runs),
        last_run_at=runs[0].created_at if runs else None,
    )


def _run_out(run: models.SkillRun) -> schemas.SkillRunOut:
    return schemas.SkillRunOut(
        id=run.id,
        skill_id=run.skill_id,
        skill_name=run.skill.name,
        skill_tint=run.skill.tint,
        output_type=run.skill.output_type,
        meeting_id=run.meeting_id,
        meeting_title=run.meeting.title,
        meeting_date=run.meeting.meeting_date,
        status=run.status,
        content=run.content or {},
        error=run.error,
        generated_by=run.generated_by,
        credits_used=run.credits_used,
        created_at=run.created_at,
    )


def _recent_meetings(db: Session, user: models.User, limit: int) -> list[models.Meeting]:
    stmt = (
        select(models.Meeting)
        .where(models.Meeting.owner_id == user.id)
        .options(selectinload(models.Meeting.segments), selectinload(models.Meeting.participants))
        .order_by(models.Meeting.meeting_date.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).unique().all())


# --------------------------------------------------------------------------- catalogue
@router.get("/skills/templates", response_model=list[schemas.SkillTemplateOut])
def list_templates(
    category: str | None = None,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> list[schemas.SkillTemplateOut]:
    """The Discover tab. Built-in prompts, annotated with whether the caller
    has already enabled each one."""
    mine = {
        s.template_key: s
        for s in db.scalars(select(models.Skill).where(models.Skill.owner_id == user.id)).all()
        if s.template_key
    }
    out = []
    for template in skills_service.TEMPLATES:
        if category and template["category"] != category:
            continue
        existing = mine.get(template["key"])
        out.append(
            schemas.SkillTemplateOut(
                **{k: template[k] for k in ("key", "name", "description", "category", "instructions", "output_type", "tint")},
                skill_id=existing.id if existing else None,
                is_enabled=bool(existing and existing.is_enabled),
            )
        )
    return out


@router.get("/skills/categories", response_model=list[str])
def list_categories() -> list[str]:
    return skills_service.CATEGORIES


@router.get("/skills/credits", response_model=schemas.CreditsOut)
def read_credits(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> schemas.CreditsOut:
    """Credit usage, metered the way the real product does it: one credit per
    meeting a skill runs on."""
    used = skills_service.credits_used(db, user)
    return schemas.CreditsOut(
        used=used,
        allowance=skills_service.CREDIT_ALLOWANCE,
        remaining=max(0, skills_service.CREDIT_ALLOWANCE - used),
        per_run=skills_service.CREDITS_PER_RUN,
    )


# ------------------------------------------------------------------------------ feed
@router.get("/skills/feed", response_model=list[schemas.SkillRunOut])
def read_feed(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    skill_id: str | None = None,
    schedule: str | None = Query(None, pattern="^(per_meeting|daily|weekly|monthly)$"),
    category: str | None = None,
    limit: int = Query(50, ge=1, le=200),
) -> list[schemas.SkillRunOut]:
    """Every output from every skill the caller owns, newest first."""
    stmt = (
        select(models.SkillRun)
        .join(models.Skill, models.Skill.id == models.SkillRun.skill_id)
        .where(models.Skill.owner_id == user.id)
        .options(selectinload(models.SkillRun.skill), selectinload(models.SkillRun.meeting))
        .order_by(models.SkillRun.created_at.desc())
        .limit(limit)
    )
    if skill_id:
        stmt = stmt.where(models.SkillRun.skill_id == skill_id)
    if schedule:
        stmt = stmt.where(models.Skill.schedule == schedule)
    if category:
        stmt = stmt.where(models.Skill.category == category)
    return [_run_out(run) for run in db.scalars(stmt).unique().all()]


# ---------------------------------------------------------------------------- skills
@router.get("/skills", response_model=list[schemas.SkillOut])
def list_skills(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    enabled: bool | None = None,
    category: str | None = None,
) -> list[schemas.SkillOut]:
    """The Active Skills tab."""
    stmt = (
        select(models.Skill)
        .where(models.Skill.owner_id == user.id)
        .options(selectinload(models.Skill.runs))
        .order_by(models.Skill.is_enabled.desc(), models.Skill.updated_at.desc())
    )
    if enabled is not None:
        stmt = stmt.where(models.Skill.is_enabled == enabled)
    if category:
        stmt = stmt.where(models.Skill.category == category)
    return [_skill_out(s) for s in db.scalars(stmt).unique().all()]


@router.post("/skills", response_model=schemas.SkillOut, status_code=status.HTTP_201_CREATED)
def create_skill(
    payload: schemas.SkillCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> schemas.SkillOut:
    """Create a skill, either from scratch or by enabling a catalogue entry.

    Enabling the same template twice returns the existing row rather than
    tripping the unique constraint — the Discover tab's Enable button is not a
    promise that the user has never enabled it before.
    """
    if payload.template_key:
        if payload.template_key not in skills_service.TEMPLATES_BY_KEY:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unknown skill template.")
        existing = (
            db.query(models.Skill)
            .filter(models.Skill.owner_id == user.id, models.Skill.template_key == payload.template_key)
            .first()
        )
        if existing:
            existing.is_enabled = payload.is_enabled or existing.is_enabled
            db.commit()
            db.refresh(existing)
            return _skill_out(existing)

    clash = (
        db.query(models.Skill)
        .filter(models.Skill.owner_id == user.id, models.Skill.name == payload.name.strip())
        .first()
    )
    if clash:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already have a skill with that name.")

    skill = models.Skill(owner_id=user.id, **payload.model_dump())
    skill.name = skill.name.strip()
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return _skill_out(skill)


@router.get("/skills/{skill_id}", response_model=schemas.SkillOut)
def read_skill(
    skill_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> schemas.SkillOut:
    return _skill_out(_owned_skill(skill_id, db, user))


@router.patch("/skills/{skill_id}", response_model=schemas.SkillOut)
def update_skill(
    skill_id: str,
    payload: schemas.SkillUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> schemas.SkillOut:
    skill = _owned_skill(skill_id, db, user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(skill, field, value.strip() if field == "name" and isinstance(value, str) else value)
    db.commit()
    db.refresh(skill)
    return _skill_out(skill)


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_skill(
    skill_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> None:
    db.delete(_owned_skill(skill_id, db, user))
    db.commit()


# ------------------------------------------------------------------------------ runs
@router.post("/skills/{skill_id}/preview", response_model=schemas.SkillPreviewOut)
def preview_skill(
    skill_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    limit: int = Query(3, ge=1, le=5),
) -> schemas.SkillPreviewOut:
    """"Try skill" — run against the most recent meetings and return the real
    output without persisting anything or charging a credit. Seeing the actual
    result before committing is the point, so this must not be a mock."""
    skill = _owned_skill(skill_id, db, user)
    results = []
    for meeting in _recent_meetings(db, user, limit):
        content, backend = skills_service.execute(skill, meeting)
        results.append(
            {
                "meeting_id": meeting.id,
                "meeting_title": meeting.title,
                "meeting_date": meeting.meeting_date.isoformat(),
                "generated_by": backend,
                "content": content,
            }
        )
    return schemas.SkillPreviewOut(skill_name=skill.name, output_type=skill.output_type, results=results)


@router.post("/skills/{skill_id}/run", response_model=list[schemas.SkillRunOut])
def run_skill(
    skill_id: str,
    payload: schemas.SkillRunRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> list[schemas.SkillRunOut]:
    """Run now: one named meeting, or every meeting this skill's filters match.

    Credits are checked before any work happens, so a run either completes for
    every meeting or does not start — a half-charged batch is worse than a
    refusal.
    """
    skill = _owned_skill(skill_id, db, user)

    if payload.meeting_id:
        meeting = db.get(models.Meeting, payload.meeting_id)
        if meeting is None or meeting.owner_id != user.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Meeting not found.")
        targets = [meeting]
    else:
        targets = [m for m in _recent_meetings(db, user, payload.limit) if skills_service.meeting_matches(skill, m)]

    if not targets:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No meetings match this skill's filters.")

    used = skills_service.credits_used(db, user)
    cost = len(targets) * skills_service.CREDITS_PER_RUN
    if used + cost > skills_service.CREDIT_ALLOWANCE:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            f"This run needs {cost} credits and you have "
            f"{max(0, skills_service.CREDIT_ALLOWANCE - used)} left.",
        )

    runs = [skills_service.run_for_meeting(db, skill, meeting) for meeting in targets]
    return [_run_out(run) for run in runs]


@router.get("/meetings/{meeting_id}/skill-runs", response_model=list[schemas.SkillRunOut])
def runs_for_meeting(
    meeting_id: str,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> list[schemas.SkillRunOut]:
    """Skill output for one meeting — rendered beside its notes."""
    stmt = (
        select(models.SkillRun)
        .join(models.Skill, models.Skill.id == models.SkillRun.skill_id)
        .where(models.SkillRun.meeting_id == meeting_id, models.Skill.owner_id == user.id)
        .options(selectinload(models.SkillRun.skill), selectinload(models.SkillRun.meeting))
        .order_by(models.SkillRun.created_at.desc())
    )
    return [_run_out(run) for run in db.scalars(stmt).unique().all()]
