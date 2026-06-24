from datetime import datetime
import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models, notifications, schemas
from app.auth import AdminPartner, CurrentPartner
from app.database import get_db
from app.in_app_notifications import create_commission_status_notification
from app.utils import calculate_commission, commission_due_date, fmt_brl

router = APIRouter(prefix="/revenue-records", tags=["Receita"])
logger = logging.getLogger(__name__)


@router.post(
    "",
    response_model=schemas.RevenueRecordResponse,
    status_code=201,
    summary="Registrar receita mensal",
)
def create_revenue_record(
    payload: schemas.RevenueRecordCreate,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    """
    Registra a receita de um mês.
    Se for o 1º mês completo de operação, cria a comissão automaticamente (transação única).
    """
    prop = db.get(models.Property, payload.property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    if prop.status != "OPERATIONAL":
        raise HTTPException(status_code=400, detail="Imóvel não está OPERATIONAL.")

    existing = db.scalar(
        select(models.RevenueRecord).where(
            models.RevenueRecord.property_id == payload.property_id,
            models.RevenueRecord.reference_year == payload.reference_year,
            models.RevenueRecord.reference_month == payload.reference_month,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Receita já registrada para este período.")

    count_prior = db.scalar(
        select(func.count()).where(models.RevenueRecord.property_id == payload.property_id)
    ) or 0
    is_first = count_prior == 0

    now = datetime.utcnow()
    record = models.RevenueRecord(
        property_id=payload.property_id,
        reference_year=payload.reference_year,
        reference_month=payload.reference_month,
        gross_revenue=payload.gross_revenue,
        wecare_admin_fee=payload.wecare_admin_fee,
        owner_payout=payload.owner_payout,
        is_first_complete_month=is_first,
        created_at=now,
    )
    db.add(record)
    db.flush()

    if is_first:
        amount = calculate_commission(prop, record)
        due = commission_due_date(payload.reference_year, payload.reference_month)
        commission = models.Commission(
            partner_id=prop.partner_id,
            property_id=prop.id,
            revenue_record_id=record.id,
            contract_model=prop.contract_model,
            commission_base=Decimal(str(record.wecare_admin_fee)),
            commission_amount=amount,
            status="PENDING",
            payment_due_date=due,
            created_at=now,
            updated_at=now,
        )
        db.add(commission)
        db.flush()
        create_commission_status_notification(
            db,
            partner_id=prop.partner_id,
            commission_id=commission.id,
            status="PENDING",
        )

        partner = db.get(models.Partner, prop.partner_id)
        if partner:
            notifications.notify_commission_generated(
                partner.email,
                partner.full_name,
                fmt_brl(amount),
                f"{prop.address_city}/{prop.address_state}",
                due.strftime("%d/%m/%Y"),
            )

    db.commit()
    db.refresh(record)
    logger.info(
        "revenue_record_created admin_id=%s property_id=%s record_id=%s first_complete_month=%s",
        _admin.id,
        prop.id,
        record.id,
        is_first,
    )
    return record


@router.get(
    "/{property_id}",
    response_model=list[schemas.RevenueRecordResponse],
    summary="Histórico de receita do imóvel",
)
def list_revenue_records(property_id: int, current: CurrentPartner, db: Session = Depends(get_db)):
    prop = db.get(models.Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    if not current.is_admin and prop.partner_id != current.id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return db.scalars(
        select(models.RevenueRecord)
        .where(models.RevenueRecord.property_id == property_id)
        .order_by(models.RevenueRecord.reference_year, models.RevenueRecord.reference_month)
    ).all()
