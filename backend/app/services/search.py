"""Transcript search.

SQLite's FTS5 index (`transcript_fts`) does the heavy lifting for global search
across every meeting. It is kept in sync explicitly rather than with triggers so
the sync points are visible in the code, and every query degrades to a plain
LIKE scan if FTS is unavailable (non-SQLite backend, or a malformed query that
FTS5 rejects).
"""
from __future__ import annotations

import re
from typing import Any

from sqlalchemy import text as sql
from sqlalchemy.orm import Session

from ..config import settings

USING_SQLITE = settings.database_url.startswith("sqlite")
_TOKEN = re.compile(r"[\w'-]+")

# Words that carry no retrieval signal in a question. Dropped in "any" mode so
# "What did we decide about mobile?" ranks on "decide" and "mobile".
QUESTION_WORDS = {
    "a", "about", "an", "and", "any", "anyone", "are", "as", "at", "be", "been", "but", "by",
    "can", "did", "do", "does", "for", "from", "get", "had", "has", "have", "how", "i", "in",
    "is", "it", "its", "me", "my", "of", "on", "or", "our", "say", "said", "should", "so",
    "some", "tell", "that", "the", "their", "them", "there", "these", "they", "this", "to",
    "us", "was", "we", "were", "what", "when", "where", "which", "who", "whom", "why", "will",
    "with", "would", "you", "your",
}


def to_match_query(query: str, prefix: bool = True, mode: str = "all") -> str:
    """Turn free text into a safe FTS5 MATCH expression.

    Every token is double-quoted so punctuation, ``AND``/``OR`` and stray quotes
    from user input can never be read as FTS5 syntax. A quoted "phrase" in the
    input is preserved as a phrase.

    ``mode="all"`` (the default) is implicit-AND, which is what a search box
    should do — more words means fewer, better results. ``mode="any"`` ORs the
    content words instead and lets bm25 rank them, which is what a
    natural-language *question* needs: no single transcript line contains every
    word of "What did we decide about mobile?".
    """
    phrases = re.findall(r'"([^"]+)"', query)
    remainder = re.sub(r'"[^"]*"', " ", query)
    tokens = _TOKEN.findall(remainder)

    if mode == "any":
        # Keep only words that discriminate; if that removes everything, fall
        # back to the raw tokens rather than returning an empty query.
        content = [t for t in tokens if t.lower() not in QUESTION_WORDS and len(t) > 2]
        tokens = content or tokens

    parts = [f'"{p.strip()}"' for p in phrases if p.strip()]
    for index, token in enumerate(tokens):
        escaped = token.replace('"', "")
        if not escaped:
            continue
        # Prefix-match only the final token, so typing "onboa" still matches.
        last = index == len(tokens) - 1
        parts.append(f'"{escaped}"*' if prefix and last and len(escaped) >= 2 else f'"{escaped}"')
    return (" OR " if mode == "any" else " ").join(parts)


def index_segments(db: Session, rows: list[dict[str, Any]]) -> None:
    """Insert `[{segment_id, meeting_id, text, speaker_name}, ...]` into FTS."""
    if not USING_SQLITE or not rows:
        return
    db.execute(
        sql(
            "INSERT INTO transcript_fts (text, speaker_name, segment_id, meeting_id) "
            "VALUES (:text, :speaker_name, :segment_id, :meeting_id)"
        ),
        rows,
    )


def remove_meeting(db: Session, meeting_id: str) -> None:
    if not USING_SQLITE:
        return
    db.execute(sql("DELETE FROM transcript_fts WHERE meeting_id = :mid"), {"mid": meeting_id})


def reindex_segment(db: Session, segment_id: str, meeting_id: str, text_value: str, speaker_name: str) -> None:
    if not USING_SQLITE:
        return
    db.execute(sql("DELETE FROM transcript_fts WHERE segment_id = :sid"), {"sid": segment_id})
    index_segments(db, [{"segment_id": segment_id, "meeting_id": meeting_id, "text": text_value, "speaker_name": speaker_name}])


def search_segments(
    db: Session, query: str, meeting_id: str | None = None, limit: int = 50, match_any: bool = False
) -> list[dict[str, Any]]:
    """Ranked transcript hits. Returns ``[{segment_id, meeting_id, ...}]``.

    Set `match_any` for question-style input — see `to_match_query`.
    """
    query = (query or "").strip()
    if not query:
        return []

    if USING_SQLITE:
        match = to_match_query(query, mode="any" if match_any else "all")
        if match:
            clause = "AND f.meeting_id = :mid" if meeting_id else ""
            statement = sql(
                f"""
                SELECT f.segment_id, f.meeting_id, bm25(transcript_fts) AS rank
                FROM transcript_fts f
                WHERE transcript_fts MATCH :match {clause}
                ORDER BY rank LIMIT :limit
                """
            )
            params: dict[str, Any] = {"match": match, "limit": limit}
            if meeting_id:
                params["mid"] = meeting_id
            try:
                return [dict(row) for row in db.execute(statement, params).mappings()]
            except Exception:
                # A query FTS5 refuses (e.g. only stopword punctuation) is not an
                # error for the user — fall through to the LIKE scan.
                db.rollback()

    needle = query
    if match_any:
        # No single LIKE can express "any of these words", so fall back to the
        # longest content word, which is the most selective one available.
        content = [t for t in _TOKEN.findall(query) if t.lower() not in QUESTION_WORDS and len(t) > 2]
        needle = max(content, key=len) if content else query

    clause = "AND meeting_id = :mid" if meeting_id else ""
    statement = sql(
        f"""
        SELECT id AS segment_id, meeting_id, 0 AS rank
        FROM transcript_segments
        WHERE (text LIKE :like OR speaker_name LIKE :like) {clause}
        ORDER BY start_ms LIMIT :limit
        """
    )
    params = {"like": f"%{needle}%", "limit": limit}
    if meeting_id:
        params["mid"] = meeting_id
    return [dict(row) for row in db.execute(statement, params).mappings()]


def make_snippet(body: str, query: str, radius: int = 90) -> str:
    """A window of `body` around the first query token, with ellipses."""
    tokens = _TOKEN.findall(query.lower())
    lowered = body.lower()
    position = next((lowered.find(t) for t in tokens if lowered.find(t) != -1), -1)
    if position == -1:
        return body[: radius * 2] + ("…" if len(body) > radius * 2 else "")
    start = max(0, position - radius)
    end = min(len(body), position + radius)
    return ("…" if start else "") + body[start:end].strip() + ("…" if end < len(body) else "")
