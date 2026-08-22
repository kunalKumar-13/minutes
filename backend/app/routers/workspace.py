"""Current user, tags and workspace analytics."""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user
from ..services.meeting_builder import AVATAR_COLORS

router = APIRouter(tags=["workspace"])


@router.get("/me", response_model=schemas.UserOut)
def read_me(user: models.User = Depends(get_current_user)) -> models.User:
    return user


@router.patch("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> models.User:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.get("/tags", response_model=list[schemas.TagCount])
def list_tags(db: Session = Depends(get_db)) -> list[schemas.TagCount]:
    """Tags with how many meetings carry each — drives the library filter."""
    counts = dict(
        db.execute(
            select(models.meeting_tags.c.tag_id, func.count(models.meeting_tags.c.meeting_id)).group_by(
                models.meeting_tags.c.tag_id
            )
        ).all()
    )
    tags = db.scalars(select(models.Tag).order_by(models.Tag.name)).all()
    return [
        schemas.TagCount(id=t.id, name=t.name, color=t.color, meeting_count=counts.get(t.id, 0)) for t in tags
    ]


@router.get("/analytics/overview", response_model=schemas.AnalyticsOverview)
def analytics_overview(db: Session = Depends(get_db)) -> schemas.AnalyticsOverview:
    """Workspace-level rollups for the Analytics page."""
    meetings = db.scalars(select(models.Meeting)).unique().all()
    total_duration = sum(m.duration_seconds for m in meetings)

    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).replace(tzinfo=None)
    this_week = sum(1 for m in meetings if m.meeting_date >= week_ago)

    open_items = db.scalar(
        select(func.count()).select_from(models.ActionItem).where(models.ActionItem.status == "open")
    ) or 0
    done_items = db.scalar(
        select(func.count()).select_from(models.ActionItem).where(models.ActionItem.status == "completed")
    ) or 0

    # Talk time is per-meeting, so roll it up by person across the workspace.
    talk: Counter[str] = Counter()
    for participant in db.scalars(select(models.Participant)).unique().all():
        talk[participant.name] += participant.talk_time_seconds
    spoken_total = sum(talk.values()) or 1
    top_speakers = [
        schemas.SpeakerShare(
            name=name,
            seconds=seconds,
            percent=round(seconds / spoken_total * 100, 1),
            color=AVATAR_COLORS[index % len(AVATAR_COLORS)],
        )
        for index, (name, seconds) in enumerate(talk.most_common(6))
    ]

    by_day: defaultdict[str, int] = defaultdict(int)
    for meeting in meetings:
        by_day[meeting.meeting_date.strftime("%Y-%m-%d")] += 1
    # Always emit a dense 14-day window so the chart has no gaps.
    today = datetime.now(timezone.utc).date()
    days = [
        {"date": (today - timedelta(days=offset)).isoformat(), "count": by_day.get((today - timedelta(days=offset)).isoformat(), 0)}
        for offset in range(13, -1, -1)
    ]

    keywords: Counter[str] = Counter()
    for summary in db.scalars(select(models.Summary)).unique().all():
        keywords.update(str(k) for k in (summary.keywords or []))

    unique_people = {p.email or p.name for p in db.scalars(select(models.Participant)).unique().all()}

    return schemas.AnalyticsOverview(
        total_meetings=len(meetings),
        total_duration_seconds=total_duration,
        total_participants=len(unique_people),
        open_action_items=open_items,
        completed_action_items=done_items,
        meetings_this_week=this_week,
        average_duration_seconds=total_duration // len(meetings) if meetings else 0,
        top_speakers=top_speakers,
        meetings_by_day=days,
        top_keywords=[{"keyword": k, "count": c} for k, c in keywords.most_common(12)],
    )
