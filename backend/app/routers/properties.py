from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import AdminPartner, CurrentPartner
from app.database import get_db
from app.in_app_notifications import create_property_status_notification

router = APIRouter(prefix="/properties", tags=["Imóveis"])


@router.post("", response_model=schemas.PropertyResponse, status_code=201, summary="Criar imóvel")
def create_property(
    payload: schemas.PropertyCreate,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    lead = db.get(models.Lead, payload.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")

    now = datetime.utcnow()
    prop = models.Property(
        lead_id=lead.id,
        partner_id=lead.partner_id,
        owner_name=payload.owner_name,
        owner_document=payload.owner_document,
        address_street=payload.address_street,
        address_number=payload.address_number,
        address_complement=payload.address_complement,
        address_city=payload.address_city,
        address_state=payload.address_state,
        address_zip=payload.address_zip,
        contract_model=payload.contract_model,
        model_a_setup_fee=payload.model_a_setup_fee,
        model_a_revenue_pct=payload.model_a_revenue_pct,
        model_b_setup_fee=payload.model_b_setup_fee,
        model_b_fixed_monthly=payload.model_b_fixed_monthly,
        model_b_revenue_pct=payload.model_b_revenue_pct,
        model_c_first_allocation=payload.model_c_first_allocation,
        model_c_ongoing_pct=payload.model_c_ongoing_pct,
        status="LEAD",
        created_at=now,
        updated_at=now,
    )
    db.add(prop)
    lead.status = "CONVERTED"
    lead.updated_at = now
    db.commit()
    db.refresh(prop)
    return prop


@router.get("", response_model=list[schemas.PropertyResponse], summary="Listar imóveis")
def list_properties(current: CurrentPartner, db: Session = Depends(get_db)):
    query = select(models.Property)
    if not current.is_admin:
        query = query.where(models.Property.partner_id == current.id)
    return db.scalars(query.order_by(models.Property.created_at.desc())).all()


@router.get("/{property_id}", response_model=schemas.PropertyResponse, summary="Consultar imóvel")
def get_property(property_id: int, current: CurrentPartner, db: Session = Depends(get_db)):
    prop = db.get(models.Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    if not current.is_admin and prop.partner_id != current.id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    return prop


@router.patch("/{property_id}", response_model=schemas.PropertyResponse, summary="Editar dados do imóvel (admin)")
def update_property(
    property_id: int,
    payload: schemas.PropertyUpdate,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    prop = db.get(models.Property, property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Imóvel não encontrado.")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(prop, field, value)
    prop.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(prop)
    return prop


@router.patch("/{property_id}/status", response_model=schemas.PropertyResponse, summary="Avançar status (admin)")
def update_property_status(
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
    return prop
