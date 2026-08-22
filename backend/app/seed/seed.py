"""Populate an empty database with a realistic sample workspace.

The fixtures are deliberately *inputs*, not database rows: each meeting is a
real transcript file in one of the formats the upload endpoint accepts, and it
goes through the same `meeting_builder.attach_transcript` path an upload does.
Seeded data and uploaded data are therefore identical in shape — there is no
special-case seeding code that could drift from the real ingest path.

The AI notes are hand-authored in `data/meetings.json` so the demo reads like a
polished workspace. Pass `--generate` to run the extractive summariser over the
same transcripts instead, which is what an upload with no notes produces.
"""
from __future__ import annotations

import argparse
import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from ..database import Base, SessionLocal, engine, init_fts
from ..services import meeting_builder, transcript_parser
from ..services.search import remove_meeting

logger = logging.getLogger(__name__)
DATA_DIR = Path(__file__).parent / "data"


def _at(days_ago: int, clock: str) -> datetime:
    """A wall-clock time N days back, so seeded data always looks recent."""
    hour, minute = (int(part) for part in clock.split(":"))
    day = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days_ago)
    return day.replace(hour=hour, minute=minute, second=0, microsecond=0)


def _ms(clock: str | None) -> int | None:
    return transcript_parser.timestamp_to_ms(clock) if clock else None


def _prepare_notes(raw: dict[str, Any], created_at: datetime) -> dict[str, Any]:
    """Turn the fixture's human-friendly fields into what the builder wants."""
    notes = dict(raw)
    notes["generated_by"] = "seed"

    notes["topics"] = [
        {
            "title": topic["title"],
            "emoji": topic.get("emoji"),
            "bullets": topic.get("bullets", []),
            "start_ms": _ms(topic.get("start_at")) or 0,
            "end_ms": _ms(topic.get("end_at")) or 0,
        }
        for topic in raw.get("topics", [])
    ]

    notes["action_items"] = [
        {
            "text": item["text"],
            "assignee_name": item.get("assignee_name"),
            "timestamp_ms": _ms(item.get("at")),
            "priority": item.get("priority", "medium"),
            "status": item.get("status", "open"),
            "due_date": created_at + timedelta(days=item["due_days"]) if "due_days" in item else None,
        }
        for item in raw.get("action_items", [])
    ]
    return notes


def seed_database(db: Session, *, generate_notes: bool = False, reset: bool = False) -> int:
    """Create the sample workspace. Returns the number of meetings created."""
    manifest = json.loads((DATA_DIR / "meetings.json").read_text(encoding="utf-8"))

    if reset:
        for meeting in db.query(models.Meeting).all():
            remove_meeting(db, meeting.id)
            db.delete(meeting)
        db.query(models.Tag).delete()
        db.commit()

    owner_spec = manifest["workspace_owner"]
    owner = db.query(models.User).filter(models.User.email == owner_spec["email"]).first()
    if owner is None:
        owner = models.User(**owner_spec)
        db.add(owner)
        db.flush()

    created = 0
    for spec in manifest["meetings"]:
        source_file = DATA_DIR / spec["file"]
        parsed = transcript_parser.parse(source_file.read_text(encoding="utf-8"), "auto", spec["file"])
        meeting_date = _at(spec["days_ago"], spec["at"])

        meeting = models.Meeting(
            owner=owner,
            title=spec["title"],
            meeting_date=meeting_date,
            source=spec.get("source", "upload"),
            media_type=spec.get("media_type", "audio"),
            media_url=spec.get("media_url"),
            is_favorite=spec.get("is_favorite", False),
            privacy=spec.get("privacy", "private"),
            language="en",
        )
        db.add(meeting)
        db.flush()

        palette = ["purple", "blue", "green", "orange", "pink", "teal", "indigo", "cyan"]
        tags: list[models.Tag] = []
        for index, name in enumerate(spec.get("tags", [])):
            tag = db.query(models.Tag).filter(models.Tag.name == name).first()
            if tag is None:
                tag = models.Tag(name=name, color=palette[index % len(palette)])
                db.add(tag)
                db.flush()
            tags.append(tag)
        meeting.tags = tags

        notes = None if generate_notes else _prepare_notes(spec["notes"], meeting_date)
        meeting_builder.attach_transcript(
            db,
            meeting,
            parsed,
            declared_participants=spec.get("participants", []),
            generate_summary=True,
            # Seeding must never depend on a network call.
            use_llm=False,
            ai=notes,
        )
        db.flush()

        _attach_extras(db, meeting, spec, owner)
        created += 1
        logger.info("Seeded %-42s %3d lines", spec["title"], len(parsed))

    db.commit()
    return created


def _attach_extras(db: Session, meeting: models.Meeting, spec: dict[str, Any], owner: models.User) -> None:
    """Soundbites and comments, which hang off transcript timestamps."""
    segments = sorted(meeting.segments, key=lambda s: s.start_ms)

    for clip in spec.get("soundbites", []):
        start, end = _ms(clip["start_at"]) or 0, _ms(clip["end_at"]) or 0
        excerpt = " ".join(s.text for s in segments if s.end_ms > start and s.start_ms < end)
        db.add(
            models.Soundbite(
                meeting=meeting,
                title=clip["title"],
                start_ms=start,
                end_ms=end,
                transcript_excerpt=excerpt[:600] or None,
                created_by_name=owner.name,
            )
        )

    for comment in spec.get("comments", []):
        at = _ms(comment.get("at"))
        # Anchor the comment to whichever line was being spoken at that moment.
        anchor = next((s for s in segments if at is not None and s.start_ms <= at <= s.end_ms), None)
        db.add(
            models.Comment(
                meeting=meeting,
                segment_id=anchor.id if anchor else None,
                author_id=owner.id,
                author_name=owner.name,
                body=comment["body"],
                timestamp_ms=at,
            )
        )


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the Fireflies clone database.")
    parser.add_argument("--reset", action="store_true", help="Delete existing meetings first.")
    parser.add_argument(
        "--generate",
        action="store_true",
        help="Generate notes with the extractive summariser instead of using the authored fixtures.",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    Base.metadata.create_all(bind=engine)
    init_fts()

    with SessionLocal() as db:
        if db.query(models.Meeting).count() and not args.reset:
            print("Database already has meetings. Re-run with --reset to rebuild.")
            return
        count = seed_database(db, generate_notes=args.generate, reset=args.reset)
    print(f"Seeded {count} meetings.")


if __name__ == "__main__":
    main()
