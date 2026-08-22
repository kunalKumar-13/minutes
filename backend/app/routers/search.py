"""Global search and the "ask a question about this meeting" endpoint."""
from __future__ import annotations

import re

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas, serializers
from ..config import settings
from ..database import get_db
from ..deps import get_meeting
from ..services import search as search_service
from ..services.transcript_parser import ms_to_timestamp

router = APIRouter(tags=["search"])


@router.get("/search", response_model=schemas.GlobalSearchResult)
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
) -> schemas.GlobalSearchResult:
    """One query across meeting titles, transcript lines and action items."""
    needle = f"%{q.strip()}%"

    meeting_stmt = (
        select(models.Meeting)
        .options(
            selectinload(models.Meeting.participants),
            selectinload(models.Meeting.tags),
            selectinload(models.Meeting.action_items),
            selectinload(models.Meeting.segments),
            selectinload(models.Meeting.summary),
            selectinload(models.Meeting.owner),
        )
        .where(or_(models.Meeting.title.ilike(needle), models.Meeting.description.ilike(needle)))
        .order_by(models.Meeting.meeting_date.desc())
        .limit(limit)
    )
    meetings = db.scalars(meeting_stmt).unique().all()

    hits = search_service.search_segments(db, q, limit=limit)
    segments: list[schemas.SegmentMatch] = []
    if hits:
        ids = [h["segment_id"] for h in hits]
        rows = db.scalars(
            select(models.TranscriptSegment)
            .options(selectinload(models.TranscriptSegment.meeting))
            .where(models.TranscriptSegment.id.in_(ids))
        ).unique().all()
        by_id = {r.id: r for r in rows}
        for hit in hits:
            segment = by_id.get(hit["segment_id"])
            if segment:
                segments.append(serializers.segment_match(segment, search_service.make_snippet(segment.text, q)))

    task_stmt = (
        select(models.ActionItem)
        .options(selectinload(models.ActionItem.meeting))
        .where(or_(models.ActionItem.text.ilike(needle), models.ActionItem.assignee_name.ilike(needle)))
        .limit(limit)
    )
    tasks = [serializers.action_item_with_meeting(t) for t in db.scalars(task_stmt).unique().all()]

    return schemas.GlobalSearchResult(
        meetings=[serializers.meeting_out(m) for m in meetings],
        segments=segments,
        action_items=tasks,
        total=len(meetings) + len(segments) + len(tasks),
    )


@router.post("/meetings/{meeting_id}/ask", response_model=schemas.AskResponse)
def ask_meeting(
    payload: schemas.AskRequest,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> schemas.AskResponse:
    """Answer a question about one meeting, always citing transcript lines.

    With an Anthropic key configured this is a real RAG answer over the
    transcript; without one it falls back to retrieval only — the most relevant
    lines, stitched into a readable response. Either way the citations are real,
    so the answer is always checkable against the recording.
    """
    question = payload.question.strip()
    hits = search_service.search_segments(db, question, meeting_id=meeting.id, limit=6, match_any=True)
    by_id = {s.id: s for s in meeting.segments}
    cited = [by_id[h["segment_id"]] for h in hits if h["segment_id"] in by_id]

    if not cited:
        # Nothing matched the wording — fall back to the notes so the user still
        # gets something grounded rather than an empty answer.
        overview = meeting.summary.overview if meeting.summary else None
        return schemas.AskResponse(
            answer=overview
            or "I couldn't find anything in this transcript that answers that. Try different wording.",
            citations=[],
            generated_by="retrieval",
        )

    citations = [
        serializers.segment_match(segment, search_service.make_snippet(segment.text, question)) for segment in cited
    ]

    if settings.anthropic_api_key:
        answer = _llm_answer(question, meeting, cited)
        if answer:
            return schemas.AskResponse(answer=answer, citations=citations, generated_by="llm")

    lead = cited[0]
    extra = "".join(f" {s.speaker_name} added: “{s.text}”" for s in cited[1:3])
    answer = (
        f"{lead.speaker_name} covered this at {ms_to_timestamp(lead.start_ms)}: “{lead.text}”{extra}"
    )
    return schemas.AskResponse(answer=answer, citations=citations, generated_by="retrieval")


def _llm_answer(question: str, meeting: models.Meeting, segments: list[models.TranscriptSegment]) -> str | None:
    try:
        import httpx

        context = "\n".join(f"[{ms_to_timestamp(s.start_ms)}] {s.speaker_name}: {s.text}" for s in segments)
        response = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": settings.anthropic_api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": settings.anthropic_model,
                "max_tokens": 700,
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            f"Answer the question using only these excerpts from the meeting "
                            f"\"{meeting.title}\". Cite timestamps inline. If the excerpts do not "
                            f"answer it, say so plainly.\n\n{context}\n\nQuestion: {question}"
                        ),
                    }
                ],
            },
            timeout=60.0,
        )
        response.raise_for_status()
        text = "".join(block.get("text", "") for block in response.json().get("content", [])).strip()
        return re.sub(r"\s+\n", "\n", text) or None
    except Exception:
        # Retrieval-only answer is a fine degradation; never fail the request.
        return None
