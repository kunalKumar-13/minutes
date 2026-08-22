"""ORM models.

Schema shape
------------
users 1--* sessions
users 1--* meetings 1--* {participants, transcript_segments, topics,
                          action_items, comments, soundbites}
meetings 1--1 summaries
meetings *--* tags   (through meeting_tags)

transcript_segments is the spine of the app: summaries, topics, action items,
comments and soundbites all anchor back to a millisecond offset inside a
meeting, which is what makes "click a line, seek the player" work in both
directions.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def _uuid() -> str:
    return uuid.uuid4().hex


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


meeting_tags = Table(
    "meeting_tags",
    Base.metadata,
    Column("meeting_id", String(32), ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(32), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    initials: Mapped[str | None] = mapped_column(String(4))
    job_title: Mapped[str | None] = mapped_column(String(120))
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    meetings: Mapped[list[Meeting]] = relationship(back_populates="owner", cascade="all, delete-orphan")
    sessions: Mapped[list[Session]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    """A signed-in browser session.

    Authentication itself is a placeholder in this build — the login screen
    signs you in as the workspace's default user rather than verifying a
    credential. What is *not* faked is the seam: a session is a real row with a
    real token and a real expiry, `Authorization: Bearer <token>` resolves to a
    user, and revoking a session actually logs that browser out. Swapping the
    placeholder for OAuth or a password check means changing only how a session
    is issued, not how anything downstream reads it.
    """

    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=lambda: uuid.uuid4().hex + uuid.uuid4().hex)
    user_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Which button on the login screen was used. Recorded because a real
    # implementation needs to know, and because it is shown back in Settings.
    provider: Mapped[str] = mapped_column(String(30), default="google")
    user_agent: Mapped[str | None] = mapped_column(String(400))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime)

    user: Mapped[User] = relationship(back_populates="sessions")

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None and self.expires_at > datetime.now(timezone.utc).replace(tzinfo=None)


Index("ix_sessions_user", Session.user_id, Session.expires_at)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(60), unique=True, nullable=False)
    color: Mapped[str] = mapped_column(String(20), default="blue")

    meetings: Mapped[list[Meeting]] = relationship(secondary=meeting_tags, back_populates="tags")


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    owner_id: Mapped[str] = mapped_column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    meeting_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=utcnow)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)

    # Where the recording came from. Live-capture sources are placeholders in
    # this clone; "upload" and "manual" are the paths that actually run.
    source: Mapped[str] = mapped_column(String(30), default="upload")
    media_url: Mapped[str | None] = mapped_column(String(600))
    media_type: Mapped[str] = mapped_column(String(20), default="audio")
    language: Mapped[str] = mapped_column(String(20), default="en")

    status: Mapped[str] = mapped_column(String(20), default="completed")
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    privacy: Mapped[str] = mapped_column(String(20), default="private")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    owner: Mapped[User] = relationship(back_populates="meetings")
    participants: Mapped[list[Participant]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="Participant.order_index"
    )
    segments: Mapped[list[TranscriptSegment]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="TranscriptSegment.start_ms"
    )
    summary: Mapped[Summary | None] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", uselist=False
    )
    topics: Mapped[list[Topic]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="Topic.order_index"
    )
    action_items: Mapped[list[ActionItem]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", order_by="ActionItem.order_index"
    )
    comments: Mapped[list[Comment]] = relationship(back_populates="meeting", cascade="all, delete-orphan")
    soundbites: Mapped[list[Soundbite]] = relationship(back_populates="meeting", cascade="all, delete-orphan")
    tags: Mapped[list[Tag]] = relationship(secondary=meeting_tags, back_populates="meetings")


Index("ix_meetings_owner_date", Meeting.owner_id, Meeting.meeting_date.desc())
Index("ix_meetings_title", Meeting.title)


class Participant(Base):
    __tablename__ = "participants"
    __table_args__ = (UniqueConstraint("meeting_id", "speaker_label", name="uq_participant_speaker"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(String(32), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)

    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str | None] = mapped_column(String(200))
    # The label used inside the raw transcript, e.g. "Speaker 1".
    speaker_label: Mapped[str] = mapped_column(String(80), nullable=False)
    is_host: Mapped[bool] = mapped_column(Boolean, default=False)
    talk_time_seconds: Mapped[int] = mapped_column(Integer, default=0)
    color: Mapped[str] = mapped_column(String(20), default="indigo")
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    meeting: Mapped[Meeting] = relationship(back_populates="participants")
    segments: Mapped[list[TranscriptSegment]] = relationship(back_populates="speaker")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(String(32), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    speaker_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("participants.id", ondelete="SET NULL"))

    order_index: Mapped[int] = mapped_column(Integer, default=0)
    # Denormalised so a segment still renders if a participant row is removed.
    speaker_name: Mapped[str] = mapped_column(String(160), nullable=False)
    start_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    end_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    sentiment: Mapped[str | None] = mapped_column(String(20))

    meeting: Mapped[Meeting] = relationship(back_populates="segments")
    speaker: Mapped[Participant | None] = relationship(back_populates="segments")


Index("ix_segments_meeting_start", TranscriptSegment.meeting_id, TranscriptSegment.start_ms)


class Summary(Base):
    __tablename__ = "summaries"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(
        String(32), ForeignKey("meetings.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Short one-liner shown in the meeting card and at the top of Overview.
    gist: Mapped[str | None] = mapped_column(Text)
    overview: Mapped[str | None] = mapped_column(Text)
    bullet_points: Mapped[list] = mapped_column(JSON, default=list)
    keywords: Mapped[list] = mapped_column(JSON, default=list)
    questions: Mapped[list] = mapped_column(JSON, default=list)
    sentiment: Mapped[str] = mapped_column(String(20), default="neutral")

    generated_by: Mapped[str] = mapped_column(String(20), default="extractive")
    model_name: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    meeting: Mapped[Meeting] = relationship(back_populates="summary")


class Topic(Base):
    """A chapter in the meeting outline; doubles as the "Key topics" list."""

    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(String(32), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(240), nullable=False)
    bullets: Mapped[list] = mapped_column(JSON, default=list)
    start_ms: Mapped[int] = mapped_column(Integer, default=0)
    end_ms: Mapped[int] = mapped_column(Integer, default=0)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    meeting: Mapped[Meeting] = relationship(back_populates="topics")


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(String(32), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    assignee_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("participants.id", ondelete="SET NULL"))

    text: Mapped[str] = mapped_column(Text, nullable=False)
    assignee_name: Mapped[str | None] = mapped_column(String(160))
    due_date: Mapped[datetime | None] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), default="open")
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    # Provenance. Regenerating notes discards "ai" items and rebuilds them, but
    # must never throw away something a person typed.
    source: Mapped[str] = mapped_column(String(20), default="ai")

    # Where in the recording the commitment was made, so the UI can jump to it.
    timestamp_ms: Mapped[int | None] = mapped_column(Integer)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

    meeting: Mapped[Meeting] = relationship(back_populates="action_items")
    assignee: Mapped[Participant | None] = relationship()


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(String(32), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    segment_id: Mapped[str | None] = mapped_column(
        String(32), ForeignKey("transcript_segments.id", ondelete="CASCADE")
    )
    author_id: Mapped[str | None] = mapped_column(String(32), ForeignKey("users.id", ondelete="SET NULL"))

    author_name: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    meeting: Mapped[Meeting] = relationship(back_populates="comments")


class Soundbite(Base):
    """A clipped highlight of the recording, Fireflies' "soundbite"."""

    __tablename__ = "soundbites"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=_uuid)
    meeting_id: Mapped[str] = mapped_column(String(32), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)

    title: Mapped[str] = mapped_column(String(240), nullable=False)
    start_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    end_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    transcript_excerpt: Mapped[str | None] = mapped_column(Text)
    created_by_name: Mapped[str | None] = mapped_column(String(160))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    meeting: Mapped[Meeting] = relationship(back_populates="soundbites")
