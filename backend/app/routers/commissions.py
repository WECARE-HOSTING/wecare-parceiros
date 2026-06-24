from datetime import datetime
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, notifications, schemas
from app.auth import AdminPartner, CurrentPartner
from app.database import get_db
from app.in_app_notifications import create_commission_status_notification
from app.utils import fmt_brl

router = APIRouter(prefix="/commissions", tags=["Comissões"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[schemas.CommissionResponse], summary="Listar comissões")
def list_commissions(
    current: CurrentPartner,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(models.Commission)
    if not current.is_admin:
        query = query.where(models.Commission.partner_id == current.id)
    if status:
        query = query.where(models.Commission.status == status)
    return db.scalars(query.order_by(models.Commission.created_at.desc())).all()


@router.get("/{commission_id}", response_model=schemas.CommissionResponse, summary="Consultar comissão")
def get_commission(commission_id: int, current: CurrentPartner, db: Session = Depends(get_db)):
    commission = db.get(models.Commission, commission_id)
    if not commission:
        raise HTTPException(status_code=404, detail="Comissão não encontrada.")
    if not current.is_admin and commission.partner_id != current.id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return commission


@router.patch(
    "/{commission_id}/status",
    response_model=schemas.CommissionResponse,
    summary="Atualizar status de comissão (admin)",
)
def update_commission_status(
    commission_id: int,
    payload: schemas.CommissionStatusUpdate,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    commission = db.get(models.Commission, commission_id)
    if not commission:
        raise HTTPException(status_code=404, detail="Comissão não encontrada.")

    now = datetime.utcnow()
    commission.status = payload.status
    if payload.status == "PAID":
        commission.paid_at = now
    if payload.cancellation_reason:
        commission.cancellation_reason = payload.cancellation_reason
    if payload.nfse_number:
        commission.nfse_number = payload.nfse_number
    commission.updated_at = now
    create_commission_status_notification(
        db,
        partner_id=commission.partner_id,
        commission_id=commission.id,
        status=payload.status,
    )
    db.commit()
    db.refresh(commission)
    logger.info(
        "commission_status_updated admin_id=%s commission_id=%s status=%s",
        _admin.id,
        commission.id,
        commission.status,
    )

    if payload.status == "PAID":
        partner = db.get(models.Partner, commission.partner_id)
        prop = db.get(models.Property, commission.property_id)
        if partner and prop:
            notifications.notify_commission_paid(
                partner.email,
                partner.full_name,
                fmt_brl(commission.commission_amount),
                f"{prop.address_city}/{prop.address_state}",
            )
    return commission
