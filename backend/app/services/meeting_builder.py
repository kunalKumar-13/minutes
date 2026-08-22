"""Assemble a full meeting row-set from a raw transcript.

This is the one place that knows how a transcript becomes a Meeting: parse ->
roster of participants -> segments -> AI notes (summary, chapters, action
items) -> FTS index. Both the upload endpoint and the seeder call it, so a
seeded meeting and an uploaded one are byte-for-byte the same kind of object.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from . import search, summarizer, transcript_parser

# Avatar tints, drawn from the Fireflies palette and assigned round-robin so a
# participant's colour is stable for a given meeting.
AVATAR_COLORS = ["purple", "blue", "pink", "orange", "green", "teal", "indigo", "cyan", "yellow", "red"]


def _color_for(index: int) -> str:
    return AVATAR_COLORS[index % len(AVATAR_COLORS)]


def build_participants(
    meeting: models.Meeting,
    segments: list[dict[str, Any]],
    declared: list[dict[str, Any]] | None = None,
) -> dict[str, models.Participant]:
    """Create Participant rows from the speakers found in the transcript.

    Names supplied on the create form are merged in: a declared participant that
    matches a transcript speaker (by name or by first name) reuses that speaker
    slot instead of creating a duplicate, and any left over are added as silent
    attendees, which is how a real roster differs from who actually spoke.
    """
    talk_time: dict[str, int] = {}
    for segment in segments:
        talk_time[segment["speaker"]] = talk_time.get(segment["speaker"], 0) + max(
            0, segment["end_ms"] - segment["start_ms"]
        )

    by_label: dict[str, models.Participant] = {}
    declared = list(declared or [])
    used_declared: set[int] = set()

    for index, label in enumerate(transcript_parser.speakers_of(segments)):
        name = label
        email = None
        is_host = index == 0
        for position, candidate in enumerate(declared):
            if position in used_declared:
                continue
            candidate_name = (candidate.get("name") or "").strip()
            if not candidate_name:
                continue
            same = candidate_name.lower() == label.lower() or (
                candidate.get("speaker_label") or ""
            ).lower() == label.lower()
            first_name_match = candidate_name.split()[0].lower() == label.split()[0].lower()
            if same or first_name_match:
                name = candidate_name
                email = candidate.get("email")
                is_host = bool(candidate.get("is_host")) or is_host
                used_declared.add(position)
                break

        participant = models.Participant(
            meeting=meeting,
            name=name,
            email=email,
            speaker_label=label,
            is_host=is_host,
            talk_time_seconds=talk_time.get(label, 0) // 1000,
            color=_color_for(index),
            order_index=index,
        )
        by_label[label] = participant

    offset = len(by_label)
    for position, candidate in enumerate(declared):
        if position in used_declared or not (candidate.get("name") or "").strip():
            continue
        label = candidate.get("speaker_label") or candidate["name"]
        if label in by_label:
            continue
        by_label[label] = models.Participant(
            meeting=meeting,
            name=candidate["name"].strip(),
            email=candidate.get("email"),
            speaker_label=label,
            is_host=bool(candidate.get("is_host")),
            talk_time_seconds=0,
            color=_color_for(offset),
            order_index=offset,
        )
        offset += 1

    return by_label


def attach_transcript(
    db: Session,
    meeting: models.Meeting,
    parsed: list[dict[str, Any]],
    declared_participants: list[dict[str, Any]] | None = None,
    generate_summary: bool = True,
    use_llm: bool = True,
    ai: dict[str, Any] | None = None,
) -> models.Meeting:
    """Populate `meeting` with participants, segments and AI notes.

    Pass `ai` to supply pre-written notes (the seeder does, so its fixtures read
    like real human notes); leave it None to have them generated.
    """
    participants = build_participants(meeting, parsed, declared_participants)
    for participant in participants.values():
        db.add(participant)

    segments: list[models.TranscriptSegment] = []
    for index, row in enumerate(parsed):
        speaker = participants.get(row["speaker"])
        segment = models.TranscriptSegment(
            meeting=meeting,
            speaker=speaker,
            order_index=index,
            speaker_name=speaker.name if speaker else row["speaker"],
            start_ms=row["start_ms"],
            end_ms=row["end_ms"],
            text=row["text"],
        )
        segments.append(segment)
        db.add(segment)

    if not meeting.duration_seconds and parsed:
        meeting.duration_seconds = max(1, parsed[-1]["end_ms"] // 1000)

    if generate_summary or ai:
        notes = ai or summarizer.summarize(
            parsed,
            title=meeting.title,
            participants=[p.name for p in participants.values()],
            use_llm=use_llm,
        )
        _apply_notes(db, meeting, notes, participants, segments)

    # Flush so every row has its generated id before the FTS rows reference them.
    db.flush()
    search.index_segments(
        db,
        [
            {
                "segment_id": s.id,
                "meeting_id": meeting.id,
                "text": s.text,
                "speaker_name": s.speaker_name,
            }
            for s in segments
        ],
    )
    return meeting


def _apply_notes(
    db: Session,
    meeting: models.Meeting,
    notes: dict[str, Any],
    participants: dict[str, models.Participant],
    segments: list[models.TranscriptSegment],
) -> None:
    meeting.summary = models.Summary(
        meeting=meeting,
        gist=notes.get("gist"),
        overview=notes.get("overview"),
        bullet_points=notes.get("bullet_points") or [],
        keywords=notes.get("keywords") or [],
        questions=notes.get("questions") or [],
        sentiment=notes.get("sentiment") or "neutral",
        generated_by=notes.get("generated_by", "extractive"),
        model_name=notes.get("model_name"),
    )
    db.add(meeting.summary)

    for index, topic in enumerate(notes.get("topics") or []):
        emoji = topic.get("emoji") or summarizer.CHAPTER_EMOJI[index % len(summarizer.CHAPTER_EMOJI)]
        db.add(
            models.Topic(
                meeting=meeting,
                # The emoji lives in the title, matching how the real Notes panel
                # renders a chapter heading.
                title=f"{emoji} {topic['title']}".strip(),
                bullets=topic.get("bullets") or [],
                start_ms=int(topic.get("start_ms") or 0),
                end_ms=int(topic.get("end_ms") or 0),
                order_index=index,
            )
        )

    # Match an action item to a participant by name so the UI can group by
    # assignee and show the right avatar.
    by_name = {p.name.lower(): p for p in participants.values()}
    by_first = {p.name.split()[0].lower(): p for p in participants.values()}
    for index, item in enumerate(notes.get("action_items") or []):
        raw_name = (item.get("assignee_name") or "").strip()
        assignee = by_name.get(raw_name.lower()) or (by_first.get(raw_name.split()[0].lower()) if raw_name else None)
        db.add(
            models.ActionItem(
                meeting=meeting,
                text=item["text"],
                assignee=assignee,
                assignee_name=assignee.name if assignee else (raw_name or None),
                priority=item.get("priority", "medium"),
                status=item.get("status", "open"),
                source=item.get("source", "ai"),
                timestamp_ms=item.get("timestamp_ms"),
                due_date=item.get("due_date"),
                order_index=index,
            )
        )

    if segments and not meeting.description:
        meeting.description = notes.get("gist")


def regenerate_notes(db: Session, meeting: models.Meeting, use_llm: bool = True) -> models.Meeting:
    """Recompute summary, chapters and action items from stored segments.

    Action items the user has already ticked off or edited are preserved —
    regenerating notes must not silently discard someone's work.
    """
    parsed = [
        {"speaker": s.speaker_name, "start_ms": s.start_ms, "end_ms": s.end_ms, "text": s.text}
        for s in sorted(meeting.segments, key=lambda s: s.start_ms)
    ]
    if not parsed:
        return meeting

    notes = summarizer.summarize(
        parsed, title=meeting.title, participants=[p.name for p in meeting.participants], use_llm=use_llm
    )

    if meeting.summary:
        db.delete(meeting.summary)
        meeting.summary = None
    for topic in list(meeting.topics):
        db.delete(topic)
    meeting.topics.clear()

    # Keep anything a person owns: items they typed, and items they ticked off.
    kept = [
        item
        for item in meeting.action_items
        if item.source == "manual" or item.status == "completed" or item.completed_at
    ]
    for item in list(meeting.action_items):
        if item not in kept:
            db.delete(item)
    meeting.action_items = kept

    # Flush the deletes before re-inserting: without this the unit of work can
    # order the new summary INSERT ahead of the old row's DELETE and trip the
    # unique constraint on summaries.meeting_id.
    db.flush()

    participants = {p.speaker_label: p for p in meeting.participants}
    _apply_notes(db, meeting, notes, participants, list(meeting.segments))
    meeting.updated_at = datetime.now(timezone.utc)
    return meeting
