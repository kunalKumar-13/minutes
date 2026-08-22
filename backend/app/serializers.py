"""ORM -> response mapping for the shapes Pydantic cannot infer alone.

`MeetingOut` carries derived fields (the summary gist, action-item counts) that
do not exist as columns. Building them here keeps routers thin and guarantees
the list view and the detail view agree on what a meeting looks like.
"""
from __future__ import annotations

from typing import Any

from . import models, schemas


def meeting_out(meeting: models.Meeting) -> schemas.MeetingOut:
    items = meeting.action_items
    return schemas.MeetingOut(
        id=meeting.id,
        title=meeting.title,
        description=meeting.description,
        meeting_date=meeting.meeting_date,
        duration_seconds=meeting.duration_seconds,
        source=meeting.source,
        media_url=meeting.media_url,
        media_type=meeting.media_type,
        language=meeting.language,
        status=meeting.status,
        is_favorite=meeting.is_favorite,
        privacy=meeting.privacy,
        created_at=meeting.created_at,
        updated_at=meeting.updated_at,
        owner=schemas.UserOut.model_validate(meeting.owner),
        participants=[schemas.ParticipantOut.model_validate(p) for p in meeting.participants],
        tags=[schemas.TagOut.model_validate(t) for t in meeting.tags],
        gist=meeting.summary.gist if meeting.summary else None,
        action_item_count=len(items),
        open_action_item_count=sum(1 for i in items if i.status != "completed"),
        segment_count=len(meeting.segments),
    )


def meeting_detail(meeting: models.Meeting) -> schemas.MeetingDetail:
    base = meeting_out(meeting).model_dump()
    return schemas.MeetingDetail(
        **base,
        segments=[schemas.SegmentOut.model_validate(s) for s in sorted(meeting.segments, key=lambda s: s.start_ms)],
        summary=schemas.SummaryOut.model_validate(meeting.summary) if meeting.summary else None,
        topics=[schemas.TopicOut.model_validate(t) for t in meeting.topics],
        action_items=[schemas.ActionItemOut.model_validate(a) for a in meeting.action_items],
        comments=[schemas.CommentOut.model_validate(c) for c in sorted(meeting.comments, key=lambda c: c.created_at)],
        soundbites=[schemas.SoundbiteOut.model_validate(s) for s in meeting.soundbites],
    )


def action_item_with_meeting(item: models.ActionItem) -> schemas.ActionItemWithMeeting:
    return schemas.ActionItemWithMeeting(
        **schemas.ActionItemOut.model_validate(item).model_dump(),
        meeting_title=item.meeting.title,
        meeting_date=item.meeting.meeting_date,
    )


def segment_match(segment: models.TranscriptSegment, snippet: str) -> schemas.SegmentMatch:
    return schemas.SegmentMatch(
        segment_id=segment.id,
        meeting_id=segment.meeting_id,
        meeting_title=segment.meeting.title,
        speaker_name=segment.speaker_name,
        start_ms=segment.start_ms,
        text=segment.text,
        snippet=snippet,
    )


def tags_for(meeting: models.Meeting, names: list[str], db: Any) -> None:
    """Replace a meeting's tags, creating any that do not exist yet."""
    resolved: list[models.Tag] = []
    palette = ["purple", "blue", "green", "orange", "pink", "teal", "indigo", "cyan"]
    for index, raw in enumerate(names):
        name = raw.strip()
        if not name:
            continue
        tag = db.query(models.Tag).filter(models.Tag.name == name).first()
        if tag is None:
            tag = models.Tag(name=name, color=palette[index % len(palette)])
            db.add(tag)
            db.flush()
        if tag not in resolved:
            resolved.append(tag)
    meeting.tags = resolved
