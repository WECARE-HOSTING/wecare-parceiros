from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import CurrentPartner
from app.database import get_db
from app.in_app_notifications import unread_count

router = APIRouter(prefix="/notifications", tags=["Notificações"])


@router.get("", response_model=schemas.NotificationListResponse, summary="Listar notificações in-app")
def list_notifications(
    current: CurrentPartner,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    notifications = db.scalars(
        select(models.InAppNotification)
        .where(models.InAppNotification.user_id == current.id)
        .order_by(models.InAppNotification.created_at.desc())
        .limit(min(max(limit, 1), 100))
    ).all()
    return schemas.NotificationListResponse(
        items=notifications,
        unread_count=unread_count(db, current.id),
    )


@router.post("/{notification_id}/read", response_model=schemas.NotificationResponse, summary="Marcar como lida")
def mark_notification_as_read(
    notification_id: int,
    current: CurrentPartner,
    db: Session = Depends(get_db),
):
    notification = db.get(models.InAppNotification, notification_id)
    if not notification or notification.user_id != current.id:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Notificação não encontrada.")

    if notification.read_at is None:
        notification.read_at = datetime.utcnow()
        db.commit()
        db.refresh(notification)
    return notification


@router.post("/read-all", summary="Marcar todas como lidas")
def mark_all_as_read(current: CurrentPartner, db: Session = Depends(get_db)):
    notifications = db.scalars(
        select(models.InAppNotification).where(
            models.InAppNotification.user_id == current.id,
            models.InAppNotification.read_at.is_(None),
        )
    ).all()
    now = datetime.utcnow()
    for notification in notifications:
        notification.read_at = now
    if notifications:
        db.commit()
    return {"detail": "Notificações marcadas como lidas."}
