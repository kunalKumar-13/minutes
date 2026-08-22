"""Derived meeting intelligence for the analysis panel.

Everything here is computed from the transcript that is already stored — no
extra model calls, no stored counters to drift out of date, and nothing invented.
That matters: a panel showing "Metrics 57" is only worth having if clicking it
lands on 57 real lines.

Four entity classes, chosen because they are what someone actually re-reads a
meeting for:

* **Date & Time** — when things are due or were agreed.
* **Metrics** — numbers, percentages, money, multipliers: the claims worth checking.
* **Tasks** — lines carrying a commitment, reusing the summariser's grammar.
* **Questions** — what was asked and may not have been answered.
"""
from __future__ import annotations

import re
from collections import Counter
from typing import Any, Iterable

from . import summarizer

# ---------------------------------------------------------------- patterns
WEEKDAYS = r"monday|tuesday|wednesday|thursday|friday|saturday|sunday"
MONTHS = (
    r"january|february|march|april|may|june|july|august|september|october|november|december"
    r"|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec"
)

DATE_TIME_RE = re.compile(
    r"\b("
    rf"{WEEKDAYS}|{MONTHS}"
    r"|today|tomorrow|yesterday|tonight|this (?:week|month|quarter|year|morning|afternoon|evening)"
    r"|next (?:week|month|quarter|year|day)|last (?:week|month|quarter|year)"
    r"|end of (?:the )?(?:week|month|quarter|year|day)|eod|eow|eoq"
    r"|q[1-4]\b"
    r"|\d{1,2}\s*(?:am|pm)|\d{1,2}:\d{2}"
    r"|\d{1,2}(?:st|nd|rd|th)\b"
    r"|(?:in|within|over) (?:the )?(?:next )?\w+ (?:days?|weeks?|months?|quarters?|years?|hours?|minutes?)"
    r"|\d+[- ](?:day|week|month|quarter|year|hour|minute)s?"
    r")\b",
    re.IGNORECASE,
)

# Spelled-out numbers show up constantly in speech and a digit-only rule misses them.
SPELLED = (
    r"zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen"
    r"|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety"
    r"|hundred|thousand|million|billion"
)

METRIC_RE = re.compile(
    r"("
    r"\d+(?:[.,]\d+)?\s*(?:%|percent)"
    r"|[$£€]\s?\d+(?:[.,]\d+)?\s*[kmb]?\b"
    r"|\b\d+(?:[.,]\d+)?\s*(?:x|times)\b"
    r"|\b\d{2,}(?:[.,]\d+)?\b"
    rf"|\b(?:{SPELLED})(?:[- ](?:{SPELLED}))*\s+percent\b"
    r"|\b(?:p\d{2}|bm25|sla)\b"
    r")",
    re.IGNORECASE,
)

QUESTION_RE = re.compile(r"[^.!?]*\?")

POSITIVE_RE = re.compile(
    r"\b(great|good|excellent|perfect|agree|agreed|happy|excited|love|nice|thanks|awesome|win|"
    r"solid|works|absolutely|fantastic|impressed|strong|clear|confident|yes)\b",
    re.IGNORECASE,
)
NEGATIVE_RE = re.compile(
    r"\b(concern|concerned|issue|issues|problem|problems|blocker|blocked|risk|risky|delay|"
    r"delayed|worried|bug|broken|fail|failing|churn|complain|frustrat|burnout|drowning|"
    r"wrong|hard|difficult|struggl|unfortunately|no)\b",
    re.IGNORECASE,
)


def _segments_as_rows(segments: Iterable[Any]) -> list[dict[str, Any]]:
    return [
        {
            "id": s.id,
            "speaker": s.speaker_name,
            "start_ms": s.start_ms,
            "end_ms": s.end_ms,
            "text": s.text,
        }
        for s in sorted(segments, key=lambda s: s.start_ms)
    ]


def segment_sentiment(text: str) -> str:
    """Per-line sentiment. Neutral unless the language clearly leans."""
    positive = len(POSITIVE_RE.findall(text))
    negative = len(NEGATIVE_RE.findall(text))
    if positive > negative and positive >= 1:
        return "positive"
    if negative > positive and negative >= 1:
        return "negative"
    return "neutral"


def _matches(rows: list[dict[str, Any]], pattern: re.Pattern[str], limit: int) -> list[dict[str, Any]]:
    hits: list[dict[str, Any]] = []
    for row in rows:
        found = {m.group(0).strip() for m in pattern.finditer(row["text"])}
        if not found:
            continue
        hits.append(
            {
                "segment_id": row["id"],
                "start_ms": row["start_ms"],
                "speaker_name": row["speaker"],
                "text": row["text"],
                "values": sorted(found)[:6],
            }
        )
        if len(hits) >= limit:
            break
    return hits


def _questions(rows: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    hits: list[dict[str, Any]] = []
    for row in rows:
        asked = [q.strip() for q in QUESTION_RE.findall(row["text"]) if len(q.split()) >= 4]
        if not asked:
            continue
        hits.append(
            {
                "segment_id": row["id"],
                "start_ms": row["start_ms"],
                "speaker_name": row["speaker"],
                "text": row["text"],
                "values": asked[:3],
            }
        )
        if len(hits) >= limit:
            break
    return hits


def _tasks(rows: list[dict[str, Any]], limit: int) -> list[dict[str, Any]]:
    """Reuse the summariser's commitment grammar so the panel and the notes agree."""
    hits: list[dict[str, Any]] = []
    by_start = {row["start_ms"]: row for row in rows}
    for item in summarizer.extract_action_items(rows, limit=limit):
        row = by_start.get(item["timestamp_ms"])
        hits.append(
            {
                "segment_id": row["id"] if row else None,
                "start_ms": item["timestamp_ms"],
                "speaker_name": item["assignee_name"],
                "text": item["text"],
                "values": [],
            }
        )
    return hits


def speaker_stats(participants: Iterable[Any], segments: Iterable[Any]) -> list[dict[str, Any]]:
    """Talk time share and words per minute, per speaker.

    WPM is the interesting one: it is words spoken divided by *their own* talk
    time, not wall-clock, so a person who says a lot in a short burst reads fast
    rather than being flattened by the meeting's length.
    """
    words: Counter[str] = Counter()
    spoken_ms: Counter[str] = Counter()
    for segment in segments:
        words[segment.speaker_name] += len(segment.text.split())
        spoken_ms[segment.speaker_name] += max(0, segment.end_ms - segment.start_ms)

    total_ms = sum(spoken_ms.values()) or 1
    rows: list[dict[str, Any]] = []
    for participant in participants:
        ms = spoken_ms.get(participant.name, participant.talk_time_seconds * 1000)
        minutes = ms / 60_000
        rows.append(
            {
                "participant_id": participant.id,
                "name": participant.name,
                "color": participant.color,
                "talk_time_seconds": round(ms / 1000),
                "talk_time_percent": round(ms / total_ms * 100, 1),
                "words": words.get(participant.name, 0),
                "wpm": round(words.get(participant.name, 0) / minutes) if minutes > 0.05 else 0,
            }
        )
    rows.sort(key=lambda row: row["talk_time_percent"], reverse=True)
    return rows


def build(meeting: Any, per_filter_limit: int = 40) -> dict[str, Any]:
    """The full payload behind the meeting analysis panel."""
    rows = _segments_as_rows(meeting.segments)

    counts = Counter(segment_sentiment(row["text"]) for row in rows)
    total = sum(counts.values()) or 1
    sentiment = [
        {"label": label, "count": counts.get(label, 0), "percent": round(counts.get(label, 0) / total * 100)}
        for label in ("neutral", "positive", "negative")
    ]

    filters = [
        {"key": "date_time", "label": "Date & Time", "color": "green", "hits": _matches(rows, DATE_TIME_RE, per_filter_limit)},
        {"key": "metrics", "label": "Metrics", "color": "cyan", "hits": _matches(rows, METRIC_RE, per_filter_limit)},
        {"key": "tasks", "label": "Tasks", "color": "orange", "hits": _tasks(rows, per_filter_limit)},
        {"key": "questions", "label": "Questions", "color": "pink", "hits": _questions(rows, per_filter_limit)},
    ]
    for entry in filters:
        entry["count"] = len(entry["hits"])

    return {
        "filters": filters,
        "sentiment": sentiment,
        "speakers": speaker_stats(meeting.participants, meeting.segments),
        "topic_trackers": [str(k) for k in (meeting.summary.keywords if meeting.summary else [])][:8],
        "word_count": sum(len(row["text"].split()) for row in rows),
        "segment_count": len(rows),
    }
