"""AI summary, chapters and regeneration."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas, serializers
from ..database import get_db
from ..deps import get_meeting
from ..services import insights as insights_service, meeting_builder

router = APIRouter(prefix="/meetings/{meeting_id}", tags=["notes"])


@router.get("/summary", response_model=schemas.SummaryOut)
def read_summary(meeting: models.Meeting = Depends(get_meeting)) -> models.Summary:
    if meeting.summary is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This meeting has no summary yet.")
    return meeting.summary


@router.patch("/summary", response_model=schemas.SummaryOut)
def update_summary(
    payload: schemas.SummaryUpdate,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> models.Summary:
    """Hand-edit the generated notes."""
    if meeting.summary is None:
        meeting.summary = models.Summary(meeting=meeting)
        db.add(meeting.summary)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(meeting.summary, field, value)
    meeting.summary.generated_by = "manual"
    db.commit()
    db.refresh(meeting.summary)
    return meeting.summary


@router.post("/summary/regenerate", response_model=schemas.MeetingDetail)
def regenerate_summary(
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> schemas.MeetingDetail:
    """Re-run the notes engine over the stored transcript.

    Completed action items survive the rebuild — see `regenerate_notes`.
    """
    if not meeting.segments:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Add a transcript before generating notes.")
    meeting_builder.regenerate_notes(db, meeting)
    db.commit()
    db.refresh(meeting)
    return serializers.meeting_detail(meeting)


@router.get("/insights", response_model=schemas.MeetingInsights)
def read_insights(meeting: models.Meeting = Depends(get_meeting)) -> schemas.MeetingInsights:
    """Derived analysis: entity filters, sentiment split, talk time and WPM.

    Computed on read rather than stored. The transcript is the source of truth,
    and caching these would only create a second thing to keep in sync with it —
    an edited line would silently leave the panel stale.
    """
    return schemas.MeetingInsights(**insights_service.build(meeting))


@router.get("/topics", response_model=list[schemas.TopicOut])
def list_topics(meeting: models.Meeting = Depends(get_meeting)) -> list[models.Topic]:
    return meeting.topics


@router.post("/topics", response_model=schemas.TopicOut, status_code=status.HTTP_201_CREATED)
def create_topic(
    payload: schemas.TopicCreate,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> models.Topic:
    topic = models.Topic(
        meeting=meeting,
        title=payload.title,
        bullets=payload.bullets,
        start_ms=payload.start_ms,
        end_ms=payload.end_ms,
        order_index=len(meeting.topics),
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/topics/{topic_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_topic(
    topic_id: str,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> None:
    topic = db.get(models.Topic, topic_id)
    if topic is None or topic.meeting_id != meeting.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Topic not found.")
    db.delete(topic)
    db.commit()
