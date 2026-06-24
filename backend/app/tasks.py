import logging
from datetime import datetime

from sqlalchemy import select

from app.database import SessionLocal
from app import models

logger = logging.getLogger(__name__)


def expire_leads_job() -> None:
    with SessionLocal() as db:
        leads = db.scalars(
            select(models.Lead).where(
                models.Lead.attribution_expires_at <= datetime.utcnow(),
                models.Lead.status.in_(["NEW", "CONTACTED", "QUALIFIED"]),
            )
        ).all()

        for lead in leads:
            lead.status = "EXPIRED"
            lead.updated_at = datetime.utcnow()

        if leads:
            db.commit()
            logger.info("Scheduler: %d leads expirados.", len(leads))
