from datetime import datetime, timedelta
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, notifications, schemas
from app.auth import AdminPartner, CurrentPartner
from app.database import get_db
from app.in_app_notifications import create_new_lead_notification

router = APIRouter(prefix="/leads", tags=["Leads"])
logger = logging.getLogger(__name__)


@router.post("/public", response_model=schemas.LeadResponse, status_code=201, summary="Indicação pública via link UTM")
def public_register_lead(payload: schemas.LeadCreate, db: Session = Depends(get_db)):
    """
    Endpoint público chamado pelo formulário /indicar.
    Não exige autenticação — identifica o parceiro pelo utm_code.
    """
    if not payload.lgpd_consent:
        raise HTTPException(status_code=400, detail="O aceite da LGPD é obrigatório.")

    partner = db.scalar(select(models.Partner).where(models.Partner.utm_code == payload.utm_code))
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado.")
    if partner.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Link de indicação inválido.")

    now = datetime.utcnow()

    for field, value, label in [
        (models.Lead.cpf, payload.cpf, "CPF"),
        (models.Lead.email, str(payload.email), "e-mail"),
    ]:
        if not value:
            continue
        dup = db.scalar(
            select(models.Lead).where(
                field == value,
                models.Lead.attribution_expires_at > now,
            )
        )
        if dup:
            raise HTTPException(
                status_code=409,
                detail=f"Conflito: lead ativo com este {label} já existe na base.",
            )

    lead = models.Lead(
        partner_id=partner.id,
        full_name=payload.full_name,
        cpf=payload.cpf,
        email=str(payload.email),
        phone=payload.phone,
        address_street=payload.address_street,
        address_number=payload.address_number,
        address_complement=payload.address_complement,
        address_city=payload.address_city,
        address_state=payload.address_state,
        address_zip=payload.address_zip,
        utm_code=payload.utm_code,
        utm_source=payload.utm_source,
        utm_medium=payload.utm_medium,
        utm_campaign=payload.utm_campaign,
        lgpd_consent=True,
        lgpd_consent_at=now,
        lgpd_consent_ip=payload.lgpd_consent_ip,
        status="CONTACTED",
        attribution_expires_at=now + timedelta(days=180),
        created_at=now,
        updated_at=now,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    logger.info(
        "public_lead_registered partner_id=%s lead_id=%s city=%s",
        partner.id,
        lead.id,
        lead.address_city,
    )

    create_new_lead_notification(
        db,
        partner_id=partner.id,
        lead_id=lead.id,
        lead_name=lead.full_name,
        city=lead.address_city,
    )
    db.commit()

    notifications.notify_new_lead(partner.email, partner.full_name, lead.full_name, lead.address_city)
    return lead


@router.post("", response_model=schemas.LeadResponse, status_code=201, summary="Registrar indicação")
def register_lead(payload: schemas.LeadCreate, db: Session = Depends(get_db)):
    """
    Endpoint público chamado pelo formulário de indicação no site.
    Aplica LGPD, valida UTM, deduplicação em 4 dimensões e janela de 180 dias.
    """
    if not payload.lgpd_consent:
        raise HTTPException(status_code=400, detail="O aceite da LGPD é obrigatório.")

    partner = db.scalar(select(models.Partner).where(models.Partner.utm_code == payload.utm_code))
    if not partner:
        raise HTTPException(status_code=404, detail="Link UTM inválido.")
    if partner.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Parceiro inativo.")

    now = datetime.utcnow()

    for field, value, label in [
        (models.Lead.cpf, payload.cpf, "CPF"),
        (models.Lead.email, str(payload.email), "e-mail"),
        (models.Lead.phone, payload.phone, "telefone"),
    ]:
        if not value:
            continue
        dup = db.scalar(
            select(models.Lead).where(
                field == value,
                models.Lead.attribution_expires_at > now,
            )
        )
        if dup:
            raise HTTPException(
                status_code=409,
                detail=f"Conflito: lead ativo com este {label} já existe na base.",
            )

    if payload.address_street and payload.address_number and payload.address_city:
        dup_addr = db.scalar(
            select(models.Lead).where(
                models.Lead.address_street == payload.address_street,
                models.Lead.address_number == payload.address_number,
                models.Lead.address_city == payload.address_city,
                models.Lead.attribution_expires_at > now,
            )
        )
        if dup_addr:
            raise HTTPException(status_code=409, detail="Conflito: endereço de imóvel já registrado.")

    lead = models.Lead(
        partner_id=partner.id,
        full_name=payload.full_name,
        cpf=payload.cpf,
        email=str(payload.email),
        phone=payload.phone,
        address_street=payload.address_street,
        address_number=payload.address_number,
        address_complement=payload.address_complement,
        address_city=payload.address_city,
        address_state=payload.address_state,
        address_zip=payload.address_zip,
        utm_code=payload.utm_code,
        utm_source=payload.utm_source,
        utm_medium=payload.utm_medium,
        utm_campaign=payload.utm_campaign,
        lgpd_consent=True,
        lgpd_consent_at=now,
        lgpd_consent_ip=payload.lgpd_consent_ip,
        status="NEW",
        attribution_expires_at=now + timedelta(days=180),
        created_at=now,
        updated_at=now,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    logger.info(
        "lead_registered partner_id=%s lead_id=%s city=%s",
        partner.id,
        lead.id,
        lead.address_city,
    )

    create_new_lead_notification(
        db,
        partner_id=partner.id,
        lead_id=lead.id,
        lead_name=lead.full_name,
        city=lead.address_city,
    )
    db.commit()

    notifications.notify_new_lead(partner.email, partner.full_name, lead.full_name, lead.address_city)
    return lead


@router.get("", response_model=list[schemas.LeadResponse], summary="Listar leads")
def list_leads(current: CurrentPartner, db: Session = Depends(get_db)):
    query = select(models.Lead)
    if not current.is_admin:
        query = query.where(models.Lead.partner_id == current.id)
    return db.scalars(query.order_by(models.Lead.created_at.desc())).all()


@router.get("/{lead_id}", response_model=schemas.LeadResponse, summary="Consultar lead")
def get_lead(lead_id: int, current: CurrentPartner, db: Session = Depends(get_db)):
    lead = db.get(models.Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    if not current.is_admin and lead.partner_id != current.id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return lead


@router.patch("/{lead_id}/status", response_model=schemas.LeadResponse, summary="Atualizar status (admin)")
def update_lead_status(
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
        "lead_status_updated admin_id=%s lead_id=%s status=%s",
        _admin.id,
        lead.id,
        lead.status,
    )
    return lead
