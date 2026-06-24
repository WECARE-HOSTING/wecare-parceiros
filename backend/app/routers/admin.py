from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import AdminPartner
from app.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin"])


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
