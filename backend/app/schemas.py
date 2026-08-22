"""Pydantic request/response models.

Naming convention: `XCreate` / `XUpdate` are request bodies, `XOut` is what the
API returns. Every `XOut` sets `from_attributes` so routers can return ORM
objects directly.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Sentiment = Literal["positive", "neutral", "negative"]
Status = Literal["open", "completed"]
Priority = Literal["low", "medium", "high"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- user
class UserOut(ORMModel):
    id: str
    name: str
    email: str
    avatar_url: str | None = None
    initials: str | None = None
    job_title: str | None = None
    timezone: str


class LoginRequest(BaseModel):
    provider: Literal["google", "microsoft", "sso", "demo"] = "google"


class LoginResponse(BaseModel):
    token: str
    expires_at: datetime
    provider: str
    user: UserOut


class SessionOut(BaseModel):
    id: str
    provider: str
    created_at: datetime
    last_seen_at: datetime
    expires_at: datetime
    user: UserOut


class UserUpdate(BaseModel):
    name: str | None = None
    job_title: str | None = None
    timezone: str | None = None
    avatar_url: str | None = None


# --------------------------------------------------------------------- participant
class ParticipantCreate(BaseModel):
    name: str
    email: str | None = None
    speaker_label: str | None = None
    is_host: bool = False


class ParticipantUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    is_host: bool | None = None


class ParticipantOut(ORMModel):
    id: str
    name: str
    email: str | None
    speaker_label: str
    is_host: bool
    talk_time_seconds: int
    color: str
    order_index: int


# ------------------------------------------------------------------------ segments
class SegmentOut(ORMModel):
    id: str
    order_index: int
    speaker_id: str | None
    speaker_name: str
    start_ms: int
    end_ms: int
    text: str
    sentiment: str | None


class SegmentUpdate(BaseModel):
    text: str | None = None
    speaker_id: str | None = None
    speaker_name: str | None = None


class SegmentMatch(BaseModel):
    """A transcript hit, with the surrounding line so the UI can show context."""

    segment_id: str
    meeting_id: str
    meeting_title: str
    speaker_name: str
    start_ms: int
    text: str
    snippet: str


# ------------------------------------------------------------------------- summary
class SummaryOut(ORMModel):
    id: str
    gist: str | None
    overview: str | None
    bullet_points: list[Any] = Field(default_factory=list)
    keywords: list[Any] = Field(default_factory=list)
    questions: list[Any] = Field(default_factory=list)
    sentiment: str
    generated_by: str
    model_name: str | None
    updated_at: datetime


class SummaryUpdate(BaseModel):
    gist: str | None = None
    overview: str | None = None
    bullet_points: list[Any] | None = None
    keywords: list[Any] | None = None


# --------------------------------------------------------------------------- topic
class TopicOut(ORMModel):
    id: str
    title: str
    bullets: list[Any] = Field(default_factory=list)
    start_ms: int
    end_ms: int
    order_index: int


class TopicCreate(BaseModel):
    title: str
    bullets: list[str] = Field(default_factory=list)
    start_ms: int = 0
    end_ms: int = 0


# --------------------------------------------------------------------- action item
class ActionItemCreate(BaseModel):
    text: str
    assignee_id: str | None = None
    assignee_name: str | None = None
    due_date: datetime | None = None
    priority: Priority = "medium"
    timestamp_ms: int | None = None


class ActionItemUpdate(BaseModel):
    text: str | None = None
    assignee_id: str | None = None
    assignee_name: str | None = None
    due_date: datetime | None = None
    status: Status | None = None
    priority: Priority | None = None


class ActionItemOut(ORMModel):
    id: str
    meeting_id: str
    text: str
    assignee_id: str | None
    assignee_name: str | None
    due_date: datetime | None
    status: str
    priority: str
    source: str
    timestamp_ms: int | None
    order_index: int
    created_at: datetime
    completed_at: datetime | None


class ActionItemWithMeeting(ActionItemOut):
    meeting_title: str
    meeting_date: datetime


# ------------------------------------------------------------------------ comments
class CommentCreate(BaseModel):
    body: str
    segment_id: str | None = None
    timestamp_ms: int | None = None


class CommentOut(ORMModel):
    id: str
    meeting_id: str
    segment_id: str | None
    author_name: str
    body: str
    timestamp_ms: int | None
    created_at: datetime


# ---------------------------------------------------------------------- soundbites
class SoundbiteCreate(BaseModel):
    title: str
    start_ms: int
    end_ms: int
    transcript_excerpt: str | None = None


class SoundbiteOut(ORMModel):
    id: str
    meeting_id: str
    title: str
    start_ms: int
    end_ms: int
    transcript_excerpt: str | None
    created_by_name: str | None
    created_at: datetime


class SoundbiteWithMeeting(SoundbiteOut):
    meeting_title: str


# ----------------------------------------------------------------------------- tag
class TagOut(ORMModel):
    id: str
    name: str
    color: str


class TagCount(TagOut):
    meeting_count: int


# ------------------------------------------------------------------------ meetings
class MeetingCreate(BaseModel):
    title: str
    description: str | None = None
    meeting_date: datetime | None = None
    duration_seconds: int | None = None
    source: str = "manual"
    media_url: str | None = None
    media_type: str = "audio"
    language: str = "en"
    participants: list[ParticipantCreate] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    # Raw transcript pasted into the create form. Parsed server-side.
    transcript_text: str | None = None
    transcript_format: Literal["auto", "txt", "vtt", "json"] = "auto"
    generate_summary: bool = True


class MeetingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    meeting_date: datetime | None = None
    duration_seconds: int | None = None
    is_favorite: bool | None = None
    privacy: str | None = None
    tags: list[str] | None = None


class MeetingOut(ORMModel):
    """Row shape for the library list — no transcript payload."""

    id: str
    title: str
    description: str | None
    meeting_date: datetime
    duration_seconds: int
    source: str
    media_url: str | None
    media_type: str
    language: str
    status: str
    is_favorite: bool
    privacy: str
    created_at: datetime
    updated_at: datetime
    owner: UserOut
    participants: list[ParticipantOut] = Field(default_factory=list)
    tags: list[TagOut] = Field(default_factory=list)
    gist: str | None = None
    action_item_count: int = 0
    open_action_item_count: int = 0
    segment_count: int = 0


class MeetingDetail(MeetingOut):
    """Everything the detail page needs, in a single round trip."""

    segments: list[SegmentOut] = Field(default_factory=list)
    summary: SummaryOut | None = None
    topics: list[TopicOut] = Field(default_factory=list)
    action_items: list[ActionItemOut] = Field(default_factory=list)
    comments: list[CommentOut] = Field(default_factory=list)
    soundbites: list[SoundbiteOut] = Field(default_factory=list)


class MeetingPage(BaseModel):
    items: list[MeetingOut]
    total: int
    page: int
    page_size: int
    has_more: bool


# -------------------------------------------------------------------------- search
class GlobalSearchResult(BaseModel):
    meetings: list[MeetingOut]
    segments: list[SegmentMatch]
    action_items: list[ActionItemWithMeeting]
    total: int


# ----------------------------------------------------------------------- analytics
class SpeakerShare(BaseModel):
    name: str
    seconds: int
    percent: float
    color: str


class AnalyticsOverview(BaseModel):
    total_meetings: int
    total_duration_seconds: int
    total_participants: int
    open_action_items: int
    completed_action_items: int
    meetings_this_week: int
    average_duration_seconds: int
    top_speakers: list[SpeakerShare]
    meetings_by_day: list[dict[str, Any]]
    top_keywords: list[dict[str, Any]]


class InsightHit(BaseModel):
    segment_id: str | None
    start_ms: int | None
    speaker_name: str | None
    text: str
    values: list[str] = Field(default_factory=list)


class InsightFilter(BaseModel):
    key: str
    label: str
    color: str
    count: int
    hits: list[InsightHit] = Field(default_factory=list)


class SentimentSlice(BaseModel):
    label: str
    count: int
    percent: int


class SpeakerStat(BaseModel):
    participant_id: str
    name: str
    color: str
    talk_time_seconds: int
    talk_time_percent: float
    words: int
    wpm: int


class MeetingInsights(BaseModel):
    filters: list[InsightFilter]
    sentiment: list[SentimentSlice]
    speakers: list[SpeakerStat]
    topic_trackers: list[str]
    word_count: int
    segment_count: int


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    citations: list[SegmentMatch]
    generated_by: str
