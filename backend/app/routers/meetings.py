"""Meeting CRUD, transcript access and export."""
from __future__ import annotations

import io
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas, serializers
from ..config import settings
from ..database import get_db
from ..deps import get_current_user, get_meeting
from ..services import meeting_builder, search as search_service, transcript_parser

router = APIRouter(prefix="/meetings", tags=["meetings"])

SORTS = {
    "recent": models.Meeting.meeting_date.desc(),
    "oldest": models.Meeting.meeting_date.asc(),
    "title": models.Meeting.title.asc(),
    "duration": models.Meeting.duration_seconds.desc(),
    "created": models.Meeting.created_at.desc(),
}


def _loaded(query):
    """Eager-load the relations every meeting response touches (no N+1)."""
    return query.options(
        selectinload(models.Meeting.participants),
        selectinload(models.Meeting.tags),
        selectinload(models.Meeting.action_items),
        selectinload(models.Meeting.segments),
        selectinload(models.Meeting.summary),
        selectinload(models.Meeting.owner),
    )


@router.get("", response_model=schemas.MeetingPage)
def list_meetings(
    db: Session = Depends(get_db),
    q: str | None = Query(None, description="Match meeting title, description or a participant name"),
    participant: str | None = None,
    tag: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    favorite: bool | None = None,
    source: str | None = None,
    sort: str = Query("recent", pattern="^(recent|oldest|title|duration|created)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> schemas.MeetingPage:
    """The meetings library, filtered and paged."""
    stmt = select(models.Meeting)

    if q:
        needle = f"%{q.strip()}%"
        speakers = select(models.Participant.meeting_id).where(models.Participant.name.ilike(needle))
        stmt = stmt.where(
            or_(
                models.Meeting.title.ilike(needle),
                models.Meeting.description.ilike(needle),
                models.Meeting.id.in_(speakers),
            )
        )
    if participant:
        matches = select(models.Participant.meeting_id).where(models.Participant.name.ilike(f"%{participant}%"))
        stmt = stmt.where(models.Meeting.id.in_(matches))
    if tag:
        tagged = select(models.meeting_tags.c.meeting_id).join(
            models.Tag, models.Tag.id == models.meeting_tags.c.tag_id
        ).where(models.Tag.name == tag)
        stmt = stmt.where(models.Meeting.id.in_(tagged))
    if date_from:
        stmt = stmt.where(models.Meeting.meeting_date >= date_from.replace(tzinfo=None))
    if date_to:
        stmt = stmt.where(models.Meeting.meeting_date <= date_to.replace(tzinfo=None))
    if favorite is not None:
        stmt = stmt.where(models.Meeting.is_favorite.is_(favorite))
    if source:
        stmt = stmt.where(models.Meeting.source == source)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    stmt = stmt.order_by(SORTS[sort]).offset((page - 1) * page_size).limit(page_size)
    rows = db.scalars(_loaded(stmt)).unique().all()

    return schemas.MeetingPage(
        items=[serializers.meeting_out(m) for m in rows],
        total=total,
        page=page,
        page_size=page_size,
        has_more=page * page_size < total,
    )


@router.post("", response_model=schemas.MeetingDetail, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: schemas.MeetingCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> schemas.MeetingDetail:
    """Create a meeting, optionally from a pasted transcript."""
    meeting = models.Meeting(
        owner=user,
        title=payload.title.strip() or "Untitled meeting",
        description=payload.description,
        meeting_date=(payload.meeting_date or datetime.now(timezone.utc)).replace(tzinfo=None),
        duration_seconds=payload.duration_seconds or 0,
        source=payload.source,
        media_url=payload.media_url,
        media_type=payload.media_type,
        language=payload.language,
    )
    db.add(meeting)
    db.flush()
    serializers.tags_for(meeting, payload.tags, db)

    if payload.transcript_text and payload.transcript_text.strip():
        try:
            parsed = transcript_parser.parse(payload.transcript_text, payload.transcript_format)
        except transcript_parser.TranscriptParseError as exc:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc
        meeting_builder.attach_transcript(
            db, meeting, parsed,
            declared_participants=[p.model_dump() for p in payload.participants],
            generate_summary=payload.generate_summary,
        )
    else:
        # No transcript: still record the roster the user typed in.
        for index, person in enumerate(payload.participants):
            db.add(
                models.Participant(
                    meeting=meeting,
                    name=person.name,
                    email=person.email,
                    speaker_label=person.speaker_label or person.name,
                    is_host=person.is_host or index == 0,
                    color=meeting_builder.AVATAR_COLORS[index % len(meeting_builder.AVATAR_COLORS)],
                    order_index=index,
                )
            )

    db.commit()
    db.refresh(meeting)
    return serializers.meeting_detail(meeting)


@router.post("/upload", response_model=schemas.MeetingDetail, status_code=status.HTTP_201_CREATED)
async def upload_meeting(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    file: UploadFile = File(..., description=".txt, .vtt, .srt or .json transcript"),
    title: str | None = Form(None),
    meeting_date: datetime | None = Form(None),
    participants: str | None = Form(None, description="JSON array or comma-separated names"),
    tags: str | None = Form(None, description="Comma-separated tag names"),
    generate_summary: bool = Form(True),
) -> schemas.MeetingDetail:
    """Create a meeting from an uploaded transcript file."""
    raw = await file.read()
    if len(raw) > settings.max_upload_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"Transcript is larger than {settings.max_upload_bytes // (1024 * 1024)}MB.",
        )
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        text = raw.decode("latin-1", errors="replace")

    try:
        parsed = transcript_parser.parse(text, "auto", file.filename)
    except transcript_parser.TranscriptParseError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc)) from exc

    declared: list[dict] = []
    if participants:
        try:
            loaded = json.loads(participants)
            declared = loaded if isinstance(loaded, list) else []
            declared = [p if isinstance(p, dict) else {"name": str(p)} for p in declared]
        except json.JSONDecodeError:
            declared = [{"name": n.strip()} for n in participants.split(",") if n.strip()]

    stem = (file.filename or "Untitled meeting").rsplit(".", 1)[0].replace("-", " ").replace("_", " ")
    meeting = models.Meeting(
        owner=user,
        title=(title or stem).strip()[:300] or "Untitled meeting",
        meeting_date=(meeting_date or datetime.now(timezone.utc)).replace(tzinfo=None),
        source="upload",
    )
    db.add(meeting)
    db.flush()
    if tags:
        serializers.tags_for(meeting, [t.strip() for t in tags.split(",")], db)

    meeting_builder.attach_transcript(
        db, meeting, parsed, declared_participants=declared, generate_summary=generate_summary
    )
    db.commit()
    db.refresh(meeting)
    return serializers.meeting_detail(meeting)


@router.get("/{meeting_id}", response_model=schemas.MeetingDetail)
def read_meeting(meeting: models.Meeting = Depends(get_meeting)) -> schemas.MeetingDetail:
    """Everything the detail page renders, in one request."""
    return serializers.meeting_detail(meeting)


@router.patch("/{meeting_id}", response_model=schemas.MeetingDetail)
def update_meeting(
    payload: schemas.MeetingUpdate,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> schemas.MeetingDetail:
    data = payload.model_dump(exclude_unset=True)
    tags = data.pop("tags", None)
    if "meeting_date" in data and data["meeting_date"]:
        data["meeting_date"] = data["meeting_date"].replace(tzinfo=None)
    for field, value in data.items():
        setattr(meeting, field, value)
    if tags is not None:
        serializers.tags_for(meeting, tags, db)
    db.commit()
    db.refresh(meeting)
    return serializers.meeting_detail(meeting)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_meeting(meeting: models.Meeting = Depends(get_meeting), db: Session = Depends(get_db)) -> None:
    # FTS rows are not covered by the FK cascade, so drop them explicitly.
    search_service.remove_meeting(db, meeting.id)
    db.delete(meeting)
    db.commit()


@router.post("/{meeting_id}/favorite", response_model=schemas.MeetingOut)
def toggle_favorite(meeting: models.Meeting = Depends(get_meeting), db: Session = Depends(get_db)) -> schemas.MeetingOut:
    meeting.is_favorite = not meeting.is_favorite
    db.commit()
    db.refresh(meeting)
    return serializers.meeting_out(meeting)


# ------------------------------------------------------------------- transcript
@router.get("/{meeting_id}/transcript", response_model=list[schemas.SegmentOut])
def read_transcript(meeting: models.Meeting = Depends(get_meeting)) -> list[models.TranscriptSegment]:
    return sorted(meeting.segments, key=lambda s: s.start_ms)


@router.get("/{meeting_id}/transcript/search", response_model=list[schemas.SegmentMatch])
def search_transcript(
    q: str,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
) -> list[schemas.SegmentMatch]:
    """Search inside one meeting. The UI highlights matches in place."""
    hits = search_service.search_segments(db, q, meeting_id=meeting.id, limit=limit)
    by_id = {s.id: s for s in meeting.segments}
    results = []
    for hit in hits:
        segment = by_id.get(hit["segment_id"])
        if segment:
            results.append(serializers.segment_match(segment, search_service.make_snippet(segment.text, q)))
    results.sort(key=lambda m: m.start_ms)
    return results


@router.patch("/{meeting_id}/transcript/{segment_id}", response_model=schemas.SegmentOut)
def update_segment(
    segment_id: str,
    payload: schemas.SegmentUpdate,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> models.TranscriptSegment:
    """Correct a transcript line or reassign its speaker."""
    segment = db.get(models.TranscriptSegment, segment_id)
    if segment is None or segment.meeting_id != meeting.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transcript line not found.")

    data = payload.model_dump(exclude_unset=True)
    if "speaker_id" in data:
        speaker = db.get(models.Participant, data["speaker_id"]) if data["speaker_id"] else None
        if speaker and speaker.meeting_id != meeting.id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "That speaker is not in this meeting.")
        segment.speaker = speaker
        if speaker:
            segment.speaker_name = speaker.name
    if data.get("speaker_name"):
        segment.speaker_name = data["speaker_name"]
    if data.get("text") is not None:
        segment.text = data["text"]

    db.flush()
    search_service.reindex_segment(db, segment.id, meeting.id, segment.text, segment.speaker_name)
    db.commit()
    db.refresh(segment)
    return segment


# ----------------------------------------------------------------- participants
@router.get("/{meeting_id}/participants", response_model=list[schemas.ParticipantOut])
def list_participants(meeting: models.Meeting = Depends(get_meeting)) -> list[models.Participant]:
    return meeting.participants


@router.post("/{meeting_id}/participants", response_model=schemas.ParticipantOut, status_code=status.HTTP_201_CREATED)
def add_participant(
    payload: schemas.ParticipantCreate,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> models.Participant:
    order = len(meeting.participants)
    label = payload.speaker_label or payload.name
    if any(p.speaker_label == label for p in meeting.participants):
        raise HTTPException(status.HTTP_409_CONFLICT, "That participant is already on this meeting.")
    participant = models.Participant(
        meeting=meeting,
        name=payload.name,
        email=payload.email,
        speaker_label=label,
        is_host=payload.is_host,
        color=meeting_builder.AVATAR_COLORS[order % len(meeting_builder.AVATAR_COLORS)],
        order_index=order,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


@router.patch("/{meeting_id}/participants/{participant_id}", response_model=schemas.ParticipantOut)
def update_participant(
    participant_id: str,
    payload: schemas.ParticipantUpdate,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> models.Participant:
    """Rename a speaker. Their transcript lines follow the new name."""
    participant = db.get(models.Participant, participant_id)
    if participant is None or participant.meeting_id != meeting.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Participant not found.")

    data = payload.model_dump(exclude_unset=True)
    renamed = "name" in data and data["name"] and data["name"] != participant.name
    for field, value in data.items():
        setattr(participant, field, value)

    if renamed:
        for segment in participant.segments:
            segment.speaker_name = participant.name
            search_service.reindex_segment(db, segment.id, meeting.id, segment.text, participant.name)
        for item in meeting.action_items:
            if item.assignee_id == participant.id:
                item.assignee_name = participant.name

    db.commit()
    db.refresh(participant)
    return participant


@router.delete("/{meeting_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def remove_participant(
    participant_id: str,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> None:
    participant = db.get(models.Participant, participant_id)
    if participant is None or participant.meeting_id != meeting.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Participant not found.")
    db.delete(participant)
    db.commit()


# ----------------------------------------------------------------------- export
def _markdown(meeting: models.Meeting) -> str:
    ts = transcript_parser.ms_to_timestamp
    lines = [f"# {meeting.title}", ""]
    lines.append(f"**Date:** {meeting.meeting_date:%B %d, %Y at %I:%M %p}  ")
    lines.append(f"**Duration:** {ts(meeting.duration_seconds * 1000)}  ")
    if meeting.participants:
        lines.append(f"**Participants:** {', '.join(p.name for p in meeting.participants)}  ")
    lines.append("")

    if meeting.summary:
        if meeting.summary.overview:
            lines += ["## Overview", "", meeting.summary.overview, ""]
        if meeting.topics:
            lines += ["## Notes", ""]
            for topic in meeting.topics:
                lines.append(f"### {topic.title} · {ts(topic.start_ms)} – {ts(topic.end_ms)}")
                lines += [f"- {b}" for b in topic.bullets] + [""]
        if meeting.summary.bullet_points:
            lines += ["## Meeting Outcome", ""] + [f"- {b}" for b in meeting.summary.bullet_points] + [""]

    if meeting.action_items:
        lines += ["## Action Items", ""]
        for item in meeting.action_items:
            box = "x" if item.status == "completed" else " "
            who = f"**{item.assignee_name}** — " if item.assignee_name else ""
            when = f" ({ts(item.timestamp_ms)})" if item.timestamp_ms is not None else ""
            lines.append(f"- [{box}] {who}{item.text}{when}")
        lines.append("")

    lines += ["## Transcript", ""]
    for segment in sorted(meeting.segments, key=lambda s: s.start_ms):
        lines.append(f"**{segment.speaker_name}** · {ts(segment.start_ms)}")
        lines += [segment.text, ""]
    return "\n".join(lines)


def _plain_text(meeting: models.Meeting) -> str:
    ts = transcript_parser.ms_to_timestamp
    header = [meeting.title, f"{meeting.meeting_date:%B %d, %Y at %I:%M %p}", ""]
    body = [f"[{ts(s.start_ms)}] {s.speaker_name}: {s.text}" for s in sorted(meeting.segments, key=lambda s: s.start_ms)]
    return "\n".join(header + body)


@router.get("/{meeting_id}/export")
def export_meeting(
    format: str = Query("md", pattern="^(md|txt|json)$"),
    meeting: models.Meeting = Depends(get_meeting),
) -> StreamingResponse:
    """Download the meeting as Markdown, plain text or JSON."""
    slug = "".join(c if c.isalnum() or c in "-_ " else "" for c in meeting.title).strip().replace(" ", "-").lower()
    slug = slug or "meeting"

    if format == "json":
        body = serializers.meeting_detail(meeting).model_dump_json(indent=2)
        media_type = "application/json"
    elif format == "txt":
        body = _plain_text(meeting)
        media_type = "text/plain; charset=utf-8"
    else:
        body = _markdown(meeting)
        media_type = "text/markdown; charset=utf-8"

    return StreamingResponse(
        io.BytesIO(body.encode("utf-8")),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{slug}.{format}"'},
    )
