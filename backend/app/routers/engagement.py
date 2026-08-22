"""Comments and soundbites — the collaboration layer on a transcript."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_user, get_meeting

router = APIRouter(tags=["engagement"])


@router.get("/meetings/{meeting_id}/comments", response_model=list[schemas.CommentOut])
def list_comments(meeting: models.Meeting = Depends(get_meeting)) -> list[models.Comment]:
    return sorted(meeting.comments, key=lambda c: c.created_at)


@router.post(
    "/meetings/{meeting_id}/comments", response_model=schemas.CommentOut, status_code=status.HTTP_201_CREATED
)
def create_comment(
    payload: schemas.CommentCreate,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> models.Comment:
    """Comment on the meeting, or on one transcript line."""
    timestamp = payload.timestamp_ms
    if payload.segment_id:
        segment = db.get(models.TranscriptSegment, payload.segment_id)
        if segment is None or segment.meeting_id != meeting.id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Transcript line not found.")
        timestamp = timestamp if timestamp is not None else segment.start_ms

    comment = models.Comment(
        meeting=meeting,
        segment_id=payload.segment_id,
        author_id=user.id,
        author_name=user.name,
        body=payload.body.strip(),
        timestamp_ms=timestamp,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_comment(comment_id: str, db: Session = Depends(get_db)) -> None:
    comment = db.get(models.Comment, comment_id)
    if comment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comment not found.")
    db.delete(comment)
    db.commit()


@router.get("/soundbites", response_model=list[schemas.SoundbiteWithMeeting])
def list_all_soundbites(
    db: Session = Depends(get_db), limit: int = Query(100, ge=1, le=300)
) -> list[schemas.SoundbiteWithMeeting]:
    """Every clipped highlight across the workspace."""
    stmt = (
        select(models.Soundbite)
        .options(selectinload(models.Soundbite.meeting))
        .order_by(models.Soundbite.created_at.desc())
        .limit(limit)
    )
    return [
        schemas.SoundbiteWithMeeting(
            **schemas.SoundbiteOut.model_validate(s).model_dump(), meeting_title=s.meeting.title
        )
        for s in db.scalars(stmt).unique().all()
    ]


@router.get("/meetings/{meeting_id}/soundbites", response_model=list[schemas.SoundbiteOut])
def list_soundbites(meeting: models.Meeting = Depends(get_meeting)) -> list[models.Soundbite]:
    return meeting.soundbites


@router.post(
    "/meetings/{meeting_id}/soundbites", response_model=schemas.SoundbiteOut, status_code=status.HTTP_201_CREATED
)
def create_soundbite(
    payload: schemas.SoundbiteCreate,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
) -> models.Soundbite:
    if payload.end_ms <= payload.start_ms:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "A soundbite must end after it starts.")

    excerpt = payload.transcript_excerpt
    if not excerpt:
        # Stitch together whatever was said inside the clipped window.
        covered = [
            s.text
            for s in sorted(meeting.segments, key=lambda s: s.start_ms)
            if s.end_ms > payload.start_ms and s.start_ms < payload.end_ms
        ]
        excerpt = " ".join(covered)[:600] or None

    soundbite = models.Soundbite(
        meeting=meeting,
        title=payload.title.strip(),
        start_ms=payload.start_ms,
        end_ms=payload.end_ms,
        transcript_excerpt=excerpt,
        created_by_name=user.name,
    )
    db.add(soundbite)
    db.commit()
    db.refresh(soundbite)
    return soundbite


@router.delete("/soundbites/{soundbite_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_soundbite(soundbite_id: str, db: Session = Depends(get_db)) -> None:
    soundbite = db.get(models.Soundbite, soundbite_id)
    if soundbite is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Soundbite not found.")
    db.delete(soundbite)
    db.commit()
