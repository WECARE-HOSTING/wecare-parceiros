from datetime import date
import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import require_admin
from app.database import get_db

router = APIRouter(prefix="/crm", tags=["CRM"])
logger = logging.getLogger(__name__)

_admin_dep = Depends(require_admin)


def _generate_codigo_wecare(db: Session) -> str:
    count = db.query(func.count(models.CrmClient.id)).scalar() or 0
    return f"WC-{(count + 1):05d}"


def _generate_codigo_cliente(db: Session) -> str:
    count = db.query(func.count(models.CrmClient.id)).scalar() or 0
    return f"PP-{(count + 1):05d}"


def _to_response(client: models.CrmClient) -> schemas.CrmClientResponse:
    partner_name = client.partner.full_name if client.partner else None
    data = {col: getattr(client, col) for col in models.CrmClient.__table__.columns.keys()}
    data["partner_name"] = partner_name
    return schemas.CrmClientResponse(**data)


def _apply_fase_transition(client: models.CrmClient, nova_fase: str) -> None:
    hoje = date.today()
    fase_anterior = client.fase_atual

    if fase_anterior in models.FASE_DATE_ATTRS:
        _, saida_attr = models.FASE_DATE_ATTRS[fase_anterior]
        if getattr(client, saida_attr) is None:
            setattr(client, saida_attr, hoje)

    if nova_fase in models.FASE_DATE_ATTRS:
        entrada_attr, _ = models.FASE_DATE_ATTRS[nova_fase]
        if getattr(client, entrada_attr) is None:
            setattr(client, entrada_attr, hoje)

    client.fase_atual = nova_fase


@router.get("/clients", response_model=list[schemas.CrmClientResponse])
def list_clients(
    _: models.Partner = _admin_dep,
    fase: str | None = Query(None),
    partner_id: int | None = Query(None),
    cidade: str | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.CrmClient).filter(models.CrmClient.deleted == False)

    if fase:
        q = q.filter(models.CrmClient.fase_atual == fase)
    if partner_id is not None:
        q = q.filter(models.CrmClient.partner_id == partner_id)
    if cidade:
        q = q.filter(models.CrmClient.cidade.ilike(f"%{cidade}%"))
    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                models.CrmClient.nome_cliente.ilike(term),
                models.CrmClient.email.ilike(term),
            )
        )

    clients = q.order_by(models.CrmClient.created_at.desc()).all()
    return [_to_response(c) for c in clients]


@router.post("/clients", response_model=schemas.CrmClientResponse, status_code=201)
def create_client(
    payload: schemas.CrmClientCreate,
    _: models.Partner = _admin_dep,
    db: Session = Depends(get_db),
):
    if payload.partner_id is not None:
        partner = db.get(models.Partner, payload.partner_id)
        if not partner:
            raise HTTPException(status_code=404, detail="Parceiro não encontrado.")

    client = models.CrmClient(
        codigo_wecare=_generate_codigo_wecare(db),
        codigo_cliente=_generate_codigo_cliente(db),
        **payload.model_dump(),
    )

    if client.fase_atual in models.FASE_DATE_ATTRS:
        entrada_attr, _ = models.FASE_DATE_ATTRS[client.fase_atual]
        setattr(client, entrada_attr, date.today())

    db.add(client)
    db.commit()
    db.refresh(client)
    logger.info("CrmClient criado id=%s codigo=%s", client.id, client.codigo_wecare)
    return _to_response(client)


@router.get("/clients/{client_id}", response_model=schemas.CrmClientResponse)
def get_client(
    client_id: int,
    _: models.Partner = _admin_dep,
    db: Session = Depends(get_db),
):
    client = db.query(models.CrmClient).filter(
        models.CrmClient.id == client_id, models.CrmClient.deleted == False
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")
    return _to_response(client)


@router.patch("/clients/{client_id}", response_model=schemas.CrmClientResponse)
def update_client(
    client_id: int,
    payload: schemas.CrmClientUpdate,
    _: models.Partner = _admin_dep,
    db: Session = Depends(get_db),
):
    client = db.query(models.CrmClient).filter(
        models.CrmClient.id == client_id, models.CrmClient.deleted == False
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    if payload.partner_id is not None:
        partner = db.get(models.Partner, payload.partner_id)
        if not partner:
            raise HTTPException(status_code=404, detail="Parceiro não encontrado.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return _to_response(client)


@router.patch("/clients/{client_id}/fase", response_model=schemas.CrmClientResponse)
def update_fase(
    client_id: int,
    payload: schemas.CrmClientFaseUpdate,
    _: models.Partner = _admin_dep,
    db: Session = Depends(get_db),
):
    client = db.query(models.CrmClient).filter(
        models.CrmClient.id == client_id, models.CrmClient.deleted == False
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    _apply_fase_transition(client, payload.fase)

    if payload.notas is not None:
        client.notas = payload.notas
    if payload.proxima_acao is not None:
        client.proxima_acao = payload.proxima_acao
    if payload.prazo is not None:
        client.prazo = payload.prazo

    db.commit()
    db.refresh(client)
    logger.info("CrmClient id=%s fase=%s", client.id, client.fase_atual)
    return _to_response(client)


@router.delete("/clients/{client_id}", status_code=204)
def delete_client(
    client_id: int,
    _: models.Partner = _admin_dep,
    db: Session = Depends(get_db),
):
    client = db.query(models.CrmClient).filter(
        models.CrmClient.id == client_id, models.CrmClient.deleted == False
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente não encontrado.")

    client.deleted = True
    db.commit()
