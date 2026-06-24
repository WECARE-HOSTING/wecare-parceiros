from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models


def create_notification(
    db: Session,
    *,
    user_id: int,
    event_id: str,
    notif_type: str,
    title: str,
    body: str,
    payload: dict | None = None,
) -> models.InAppNotification:
    existing = db.scalar(
        select(models.InAppNotification).where(models.InAppNotification.event_id == event_id)
    )
    if existing:
        return existing

    notification = models.InAppNotification(
        user_id=user_id,
        event_id=event_id,
        type=notif_type,
        title=title,
        body=body,
        payload=payload,
        created_at=datetime.utcnow(),
    )
    db.add(notification)
    return notification


def create_new_lead_notification(
    db: Session,
    *,
    partner_id: int,
    lead_id: int,
    lead_name: str,
    city: str | None,
) -> None:
    city_part = f" em {city}" if city else ""
    create_notification(
        db,
        user_id=partner_id,
        event_id=f"lead:new:{lead_id}",
        notif_type="NEW_LEAD",
        title="Novo lead recebido",
        body=f"{lead_name}{city_part}",
        payload={"lead_id": lead_id},
    )


def create_commission_status_notification(
    db: Session,
    *,
    partner_id: int,
    commission_id: int,
    status: str,
) -> None:
    status_map = {
        "PENDING": "Comissão gerada",
        "AWAITING_NFSE": "Aguardando NFS-e",
        "APPROVED": "Comissão aprovada",
        "PAID": "Comissão paga",
        "CANCELLED": "Comissão cancelada",
    }
    create_notification(
        db,
        user_id=partner_id,
        event_id=f"commission:status:{commission_id}:{status}",
        notif_type="COMMISSION_UPDATED",
        title=status_map.get(status, "Comissão atualizada"),
        body=f"Comissão #{commission_id} está em {status}.",
        payload={"commission_id": commission_id, "status": status},
    )


def create_property_status_notification(
    db: Session,
    *,
    partner_id: int,
    property_id: int,
    status: str,
) -> None:
    create_notification(
        db,
        user_id=partner_id,
        event_id=f"property:status:{property_id}:{status}",
        notif_type="PROPERTY_STATUS",
        title="Status de imóvel atualizado",
        body=f"Imóvel #{property_id} agora está em {status}.",
        payload={"property_id": property_id, "status": status},
    )


def unread_count(db: Session, user_id: int) -> int:
    return (
        db.scalar(
            select(func.count()).where(
                models.InAppNotification.user_id == user_id,
                models.InAppNotification.read_at.is_(None),
            )
        )
        or 0
    )
