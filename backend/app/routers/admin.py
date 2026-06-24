from datetime import datetime, timedelta
from decimal import Decimal
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app import models, notifications, schemas
from app.auth import AdminPartner
from app.database import get_db
from app.in_app_notifications import create_property_status_notification

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)

KANBAN_COLUMNS = ("NEW", "CONTACTED", "QUALIFIED", "ONBOARDING", "OPERATIONAL", "CANCELLED")


def resolve_kanban_column(lead_status: str, property_status: str | None) -> str:
    if lead_status in ("EXPIRED", "DISQUALIFIED"):
        return "CANCELLED"
    if property_status == "CANCELLED":
        return "CANCELLED"
    if lead_status == "CONVERTED":
        if property_status == "OPERATIONAL":
            return "OPERATIONAL"
        return "ONBOARDING"
    if lead_status in KANBAN_COLUMNS:
        return lead_status
    return "CANCELLED"


def _commission_summary(commissions: list[models.Commission]) -> schemas.KanbanCommissionSummary | None:
    if not commissions:
        return None
    pending_statuses = {"PENDING", "AWAITING_NFSE", "APPROVED"}
    pending = [c for c in commissions if c.status in pending_statuses]
    paid = [c for c in commissions if c.status == "PAID"]
    latest = max(commissions, key=lambda c: c.created_at)
    return schemas.KanbanCommissionSummary(
        count_pending=len(pending),
        count_paid=len(paid),
        total_pending=Decimal(str(sum(c.commission_amount for c in pending))),
        total_paid=Decimal(str(sum(c.commission_amount for c in paid))),
        latest_status=latest.status,
    )


def _build_kanban_card(lead: models.Lead) -> schemas.KanbanLeadCard:
    prop = lead.properties[0] if lead.properties else None
    prop_summary = None
    commissions: list[models.Commission] = []
    if prop:
        prop_summary = schemas.KanbanPropertySummary(
            id=prop.id,
            status=prop.status,
            address_city=prop.address_city,
            address_state=prop.address_state,
            owner_name=prop.owner_name,
            contract_model=prop.contract_model,
        )
        commissions = list(prop.commissions)

    days_remaining = (lead.attribution_expires_at.date() - datetime.utcnow().date()).days

    return schemas.KanbanLeadCard(
        id=lead.id,
        partner_id=lead.partner_id,
        full_name=lead.full_name,
        email=lead.email,
        cpf=lead.cpf,
        phone=lead.phone,
        address_street=lead.address_street,
        address_number=lead.address_number,
        address_complement=lead.address_complement,
        address_city=lead.address_city,
        address_state=lead.address_state,
        address_zip=lead.address_zip,
        status=lead.status,
        attribution_expires_at=lead.attribution_expires_at,
        created_at=lead.created_at,
        partner_name=lead.partner.full_name,
        partner_utm_code=lead.partner.utm_code,
        days_remaining_attribution=days_remaining,
        kanban_column=resolve_kanban_column(lead.status, prop.status if prop else None),
        property=prop_summary,
        commission=_commission_summary(commissions),
    )


@router.get("/dashboard", response_model=schemas.AdminDashboard, summary="Painel global (admin)")
def admin_dashboard(_admin: AdminPartner, db: Session = Depends(get_db)):
    def count(*filters):
        return db.scalar(select(func.count()).where(*filters)) or 0

    def sum_amount(*filters):
        return db.scalar(
            select(func.coalesce(func.sum(models.Commission.commission_amount), 0)).where(*filters)
        ) or Decimal("0")

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    return schemas.AdminDashboard(
        partners_total=count(models.Partner.id.isnot(None)),
        partners_active=count(models.Partner.status == "ACTIVE"),
        partners_pending=count(models.Partner.status == "PENDING"),
        leads_total=count(models.Lead.id.isnot(None)),
        leads_active=count(models.Lead.status.in_(["NEW", "CONTACTED", "QUALIFIED"])),
        leads_week=count(models.Lead.created_at >= week_ago),
        leads_converted=count(models.Lead.status == "CONVERTED"),
        properties_total=count(models.Property.id.isnot(None)),
        properties_operational=count(models.Property.status == "OPERATIONAL"),
        commissions_pending_count=count(
            models.Commission.status.in_(["PENDING", "AWAITING_NFSE", "APPROVED"])
        ),
        commissions_pending_amount=Decimal(str(sum_amount(
            models.Commission.status.in_(["PENDING", "AWAITING_NFSE", "APPROVED"])
        ))),
        commissions_paid_month=Decimal(str(sum_amount(
            models.Commission.status == "PAID",
            models.Commission.paid_at >= month_start,
        ))),
    )


@router.get("/kanban", response_model=schemas.KanbanResponse, summary="Kanban gerencial de leads")
def admin_kanban(_admin: AdminPartner, db: Session = Depends(get_db)):
    leads = db.scalars(
        select(models.Lead)
        .options(
            joinedload(models.Lead.partner),
            joinedload(models.Lead.properties).joinedload(models.Property.commissions),
        )
        .order_by(models.Lead.created_at.desc())
    ).unique().all()

    groups: dict[str, list[schemas.KanbanLeadCard]] = {col: [] for col in KANBAN_COLUMNS}
    for lead in leads:
        card = _build_kanban_card(lead)
        groups[card.kanban_column].append(card)

    return schemas.KanbanResponse(**groups)


@router.patch("/leads/{lead_id}/status", response_model=schemas.LeadResponse, summary="Atualizar status do lead (admin)")
def admin_update_lead_status(
    lead_id: int,
    payload: schemas.LeadStatusUpdate,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    lead = db.get(models.Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")

    if payload.status == "DISQUALIFIED" and payload.reason:
        partner = db.get(models.Partner, lead.partner_id)
        if partner:
            notifications.notify_lead_invalidated(
                partner.email, partner.full_name, lead.full_name, payload.reason
            )

    lead.status = payload.status
    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    logger.info(
        "admin_lead_status_updated admin_id=%s lead_id=%s status=%s",
        _admin.id,
        lead.id,
        lead.status,
    )
    return lead


@router.patch(
    "/properties/{property_id}/status",
    response_model=schemas.PropertyResponse,
    summary="Atualizar status do imóvel (admin)",
)
def admin_update_property_status(
    property_id: int,
    payload: schemas.PropertyStatusUpdate,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    prop = db.get(models.Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    now = datetime.utcnow()
    if payload.status == "OPERATIONAL" and prop.operational_since is None:
        prop.operational_since = now
    prop.status = payload.status
    prop.updated_at = now
    create_property_status_notification(
        db,
        partner_id=prop.partner_id,
        property_id=prop.id,
        status=payload.status,
    )
    db.commit()
    db.refresh(prop)
    logger.info(
        "admin_property_status_updated admin_id=%s property_id=%s status=%s",
        _admin.id,
        prop.id,
        prop.status,
    )
    return prop
