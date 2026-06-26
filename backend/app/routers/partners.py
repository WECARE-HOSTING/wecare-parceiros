import os
import uuid
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, notifications, schemas
from app.auth import AdminPartner, CurrentPartner, hash_password
from app.database import get_db
from app.utils import generate_utm_code, infer_document_type

BASE_REFERRAL_URL = os.getenv("FRONTEND_URL", "http://localhost:3000") + "/cadastro"
DEFAULT_PARTNER_PASSWORD = "Wecare@2026"
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", "./uploads"))

_ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}
_MAX_SIZE = 5 * 1024 * 1024  # 5 MB

router = APIRouter(prefix="/partners", tags=["Parceiros"])


@router.post(
    "/register",
    response_model=dict,
    status_code=201,
    summary="Auto-cadastro de parceiro (público)",
)
def register_partner(
    payload: schemas.PartnerSelfRegister,
    request: Request,
    db: Session = Depends(get_db),
):
    """Endpoint público. O parceiro se cadastra, assina o Termo e recebe acesso imediato."""
    email = str(payload.email)
    if db.scalar(select(models.Partner).where(models.Partner.email == email)):
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado.")
    if db.scalar(select(models.Partner).where(models.Partner.document == payload.document)):
        raise HTTPException(status_code=409, detail="Este CPF/CNPJ já está cadastrado.")

    utm_code = generate_utm_code(db)
    referral_url = (
        f"{BASE_REFERRAL_URL}"
        f"?utm_source=parceiro&utm_medium=referral&utm_campaign={utm_code}"
    )
    now = datetime.utcnow()
    client_ip = request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or (
        request.client.host if request.client else None
    )
    partner = models.Partner(
        full_name=payload.full_name,
        document=payload.document,
        document_type=infer_document_type(payload.document),
        email=email,
        phone=payload.phone,
        segment=payload.segment,
        company_name=payload.company_name,
        hashed_password=hash_password(DEFAULT_PARTNER_PASSWORD),
        is_admin=False,
        utm_code=utm_code,
        referral_url=referral_url,
        status="ACTIVE",
        must_change_password=True,
        term_accepted_at=now,
        term_ip=client_ip,
        term_version=payload.term_version,
        created_at=now,
        updated_at=now,
    )
    try:
        db.add(partner)
        db.commit()
        db.refresh(partner)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Este e-mail ou CPF/CNPJ já está cadastrado.")
    notifications.notify_partner_registered(partner.email, partner.full_name, DEFAULT_PARTNER_PASSWORD)
    return {
        "detail": "Cadastro realizado! Bem-vindo à WeCare.",
        "partner_id": partner.id,
    }


@router.post("", response_model=schemas.PartnerResponse, status_code=201, summary="Cadastrar parceiro")
def create_partner(
    payload: schemas.PartnerCreate,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    utm_code = generate_utm_code(db)
    referral_url = (
        f"{BASE_REFERRAL_URL}"
        f"?utm_source=parceiro&utm_medium=referral&utm_campaign={utm_code}"
    )
    now = datetime.utcnow()
    partner = models.Partner(
        full_name=payload.full_name,
        document=payload.document,
        document_type=infer_document_type(payload.document),
        email=str(payload.email),
        phone=payload.phone,
        segment=payload.segment,
        company_name=payload.company_name,
        bank_info=payload.bank_info,
        hashed_password=hash_password(payload.initial_password) if payload.initial_password else None,
        is_admin=False,
        utm_code=utm_code,
        referral_url=referral_url,
        status="PENDING",
        created_at=now,
        updated_at=now,
    )
    try:
        db.add(partner)
        db.commit()
        db.refresh(partner)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe parceiro com este documento ou e-mail.")
    return partner


@router.get("", response_model=list[schemas.PartnerResponse], summary="Listar parceiros (admin)")
def list_partners(_admin: AdminPartner, db: Session = Depends(get_db)):
    return db.scalars(select(models.Partner).order_by(models.Partner.created_at.desc())).all()


@router.get("/{partner_id}", response_model=schemas.PartnerResponse, summary="Consultar parceiro")
def get_partner(partner_id: int, current: CurrentPartner, db: Session = Depends(get_db)):
    if not current.is_admin and current.id != partner_id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    partner = db.get(models.Partner, partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado.")
    return partner


@router.patch("/{partner_id}", response_model=schemas.PartnerResponse, summary="Atualizar dados do parceiro")
def update_partner(
    partner_id: int,
    payload: schemas.PartnerUpdate,
    current: CurrentPartner,
    db: Session = Depends(get_db),
):
    if not current.is_admin and current.id != partner_id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    partner = db.get(models.Partner, partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado.")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(partner, field, value)
    partner.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(partner)
    return partner


@router.patch("/{partner_id}/status", response_model=schemas.PartnerResponse, summary="Atualizar status")
def update_partner_status(
    partner_id: int,
    payload: schemas.PartnerStatusUpdate,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    partner = db.get(models.Partner, partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado.")
    old_status = partner.status
    partner.status = payload.status
    partner.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(partner)

    if old_status != "ACTIVE" and payload.status == "ACTIVE":
        notifications.notify_partner_activated(partner.email, partner.full_name, partner.referral_url)
    return partner


@router.post(
    "/{partner_id}/documents",
    response_model=schemas.PartnerResponse,
    summary="Upload de documento do parceiro",
)
async def upload_document(
    partner_id: int,
    doc_type: str,
    file: UploadFile,
    current: CurrentPartner,
    db: Session = Depends(get_db),
):
    if not current.is_admin and current.id != partner_id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    partner = db.get(models.Partner, partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado.")

    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail="Tipo de arquivo não permitido. Use PDF, JPEG ou PNG.")

    content = await file.read()
    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=422, detail="Arquivo muito grande. Tamanho máximo: 5 MB.")

    ext = Path(file.filename or "doc").suffix.lower() or ".bin"
    safe_name = f"{doc_type}_{uuid.uuid4().hex}{ext}"
    dest_dir = UPLOADS_DIR / "partners" / str(partner_id)
    dest_dir.mkdir(parents=True, exist_ok=True)
    (dest_dir / safe_name).write_bytes(content)

    existing = list(partner.documents or [])
    existing.append({
        "doc_type": doc_type,
        "filename": safe_name,
        "original_name": file.filename,
        "size": len(content),
        "uploaded_at": datetime.utcnow().isoformat(),
    })
    partner.documents = existing
    partner.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(partner)
    return partner


@router.get(
    "/{partner_id}/documents/{filename}",
    summary="Baixar documento do parceiro",
)
def download_document(
    partner_id: int,
    filename: str,
    current: CurrentPartner,
    db: Session = Depends(get_db),
):
    if not current.is_admin and current.id != partner_id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    partner = db.get(models.Partner, partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado.")

    # Sanitize: no path traversal
    if "/" in filename or "\\" in filename or ".." in filename:
        raise HTTPException(status_code=400, detail="Nome de arquivo inválido.")

    file_path = UPLOADS_DIR / "partners" / str(partner_id) / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Arquivo não encontrado.")
    return FileResponse(file_path, filename=filename)


@router.get("/{partner_id}/dashboard", response_model=schemas.PartnerDashboard, summary="Painel do parceiro")
def get_dashboard(partner_id: int, current: CurrentPartner, db: Session = Depends(get_db)):
    if not current.is_admin and current.id != partner_id:
        raise HTTPException(status_code=403, detail="Acesso negado.")
    partner = db.get(models.Partner, partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Parceiro não encontrado.")

    def count(*filters):
        return db.scalar(select(func.count()).where(*filters)) or 0

    def sum_commissions(*filters):
        return db.scalar(
            select(func.coalesce(func.sum(models.Commission.commission_amount), 0)).where(*filters)
        ) or Decimal("0")

    today = date.today()
    month_start = today.replace(day=1)
    if today.month == 12:
        next_month_start = date(today.year + 1, 1, 1)
    else:
        next_month_start = date(today.year, today.month + 1, 1)

    return schemas.PartnerDashboard(
        partner_id=partner_id,
        partner_name=partner.full_name,
        utm_link=partner.referral_url,
        total_leads=count(models.Lead.partner_id == partner_id),
        active_leads=count(
            models.Lead.partner_id == partner_id,
            models.Lead.status.in_(["NEW", "CONTACTED", "QUALIFIED"]),
        ),
        leads_new=count(
            models.Lead.partner_id == partner_id,
            models.Lead.status == "NEW",
        ),
        leads_in_progress=count(
            models.Lead.partner_id == partner_id,
            models.Lead.status.in_(["CONTACTED", "QUALIFIED"]),
        ),
        leads_not_converted=count(
            models.Lead.partner_id == partner_id,
            models.Lead.status.in_(["EXPIRED", "DISQUALIFIED"]),
        ),
        converted_leads=count(
            models.Lead.partner_id == partner_id,
            models.Lead.status == "CONVERTED",
        ),
        total_properties=count(models.Property.partner_id == partner_id),
        operational_properties=count(
            models.Property.partner_id == partner_id,
            models.Property.status == "OPERATIONAL",
        ),
        pending_commissions=count(
            models.Commission.partner_id == partner_id,
            models.Commission.status.in_(["PENDING", "AWAITING_NFSE", "APPROVED"]),
        ),
        total_commissions_paid=Decimal(str(sum_commissions(
            models.Commission.partner_id == partner_id,
            models.Commission.status == "PAID",
        ))),
        total_commissions_pending=Decimal(str(sum_commissions(
            models.Commission.partner_id == partner_id,
            models.Commission.status.in_(["PENDING", "AWAITING_NFSE", "APPROVED"]),
        ))),
        commissions_to_receive_month=Decimal(str(sum_commissions(
            models.Commission.partner_id == partner_id,
            models.Commission.status.in_(["PENDING", "AWAITING_NFSE"]),
            models.Commission.payment_due_date >= month_start,
            models.Commission.payment_due_date < next_month_start,
        ))),
    )
