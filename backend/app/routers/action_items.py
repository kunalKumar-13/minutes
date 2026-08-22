"""Action items, both per-meeting and across the workspace."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from .. import models, schemas, serializers
from ..database import get_db
from ..deps import get_meeting

router = APIRouter(tags=["action items"])


@router.get("/tasks", response_model=list[schemas.ActionItemWithMeeting])
def list_all_tasks(
    db: Session = Depends(get_db),
    status_filter: str | None = Query(None, alias="status", pattern="^(open|completed)$"),
    assignee: str | None = None,
    q: str | None = None,
    limit: int = Query(200, ge=1, le=500),
) -> list[schemas.ActionItemWithMeeting]:
    """Every action item in the workspace — powers the Tasks page."""
    stmt = select(models.ActionItem).options(selectinload(models.ActionItem.meeting))
    if status_filter:
        stmt = stmt.where(models.ActionItem.status == status_filter)
    if assignee:
        stmt = stmt.where(models.ActionItem.assignee_name.ilike(f"%{assignee}%"))
    if q:
        stmt = stmt.where(models.ActionItem.text.ilike(f"%{q}%"))
    stmt = stmt.order_by(models.ActionItem.status.asc(), models.ActionItem.created_at.desc()).limit(limit)
    return [serializers.action_item_with_meeting(item) for item in db.scalars(stmt).unique().all()]


@router.get("/meetings/{meeting_id}/action-items", response_model=list[schemas.ActionItemOut])
def list_action_items(meeting: models.Meeting = Depends(get_meeting)) -> list[models.ActionItem]:
    return meeting.action_items


@router.post(
    "/meetings/{meeting_id}/action-items",
    response_model=schemas.ActionItemOut,
    status_code=status.HTTP_201_CREATED,
)
def create_action_item(
    payload: schemas.ActionItemCreate,
    meeting: models.Meeting = Depends(get_meeting),
    db: Session = Depends(get_db),
) -> models.ActionItem:
    assignee = None
    if payload.assignee_id:
        assignee = db.get(models.Participant, payload.assignee_id)
        if assignee is None or assignee.meeting_id != meeting.id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "That assignee is not in this meeting.")

    item = models.ActionItem(
        meeting=meeting,
        text=payload.text.strip(),
        assignee=assignee,
        assignee_name=assignee.name if assignee else payload.assignee_name,
        due_date=payload.due_date.replace(tzinfo=None) if payload.due_date else None,
        priority=payload.priority,
        timestamp_ms=payload.timestamp_ms,
        source="manual",
        order_index=len(meeting.action_items),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/action-items/{item_id}", response_model=schemas.ActionItemOut)
def update_action_item(
    item_id: str,
    payload: schemas.ActionItemUpdate,
    db: Session = Depends(get_db),
) -> models.ActionItem:
    """Edit, reassign, or tick off an action item."""
    item = db.get(models.ActionItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Action item not found.")

    data = payload.model_dump(exclude_unset=True)
    if "assignee_id" in data:
        assignee = db.get(models.Participant, data["assignee_id"]) if data["assignee_id"] else None
        if assignee and assignee.meeting_id != item.meeting_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "That assignee is not in this meeting.")
        item.assignee = assignee
        if assignee:
            item.assignee_name = assignee.name
        data.pop("assignee_id")
    if data.get("due_date"):
        data["due_date"] = data["due_date"].replace(tzinfo=None)
    if "status" in data:
        # completed_at is derived from status, never set directly by the client.
        item.completed_at = datetime.now(timezone.utc).replace(tzinfo=None) if data["status"] == "completed" else None
    for field, value in data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/action-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
def delete_action_item(item_id: str, db: Session = Depends(get_db)) -> None:
    item = db.get(models.ActionItem, item_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Action item not found.")
    db.delete(item)
    db.commit()
