from datetime import date, datetime, timedelta
import csv
import io
import logging
import re

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, notifications, schemas
from app.auth import AdminPartner, CurrentPartner
from app.database import get_db
from app.in_app_notifications import create_new_lead_notification

router = APIRouter(prefix="/leads", tags=["Leads"])
logger = logging.getLogger(__name__)


def _next_crm_codes(db: Session) -> tuple[str, str]:
    """Retorna (codigo_wecare, codigo_cliente) sequenciais baseados no MAX existente."""
    from sqlalchemy import func as sqlfunc

    def _next(prefix: str, col) -> str:
        max_val = db.query(sqlfunc.max(col)).filter(col.like(f"{prefix}-%")).scalar()
        if max_val:
            m = re.search(r"(\d+)$", max_val)
            num = int(m.group(1)) + 1 if m else 1
        else:
            num = 1
        return f"{prefix}-{num:05d}"

    wc = _next("WC", models.CrmClient.codigo_wecare)
    pp = _next("PP", models.CrmClient.codigo_cliente)
    return wc, pp


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
        email=str(payload.email) if payload.email else None,
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

    codigo_wecare, codigo_cliente = _next_crm_codes(db)
    crm_client = models.CrmClient(
        codigo_wecare=codigo_wecare,
        codigo_cliente=codigo_cliente,
        nome_cliente=lead.full_name,
        email=lead.email,
        telefone=lead.phone,
        cidade=lead.address_city,
        estado=lead.address_state,
        canal_aquisicao="Indicação",
        partner_id=lead.partner_id,
        fase_atual="1_lead",
        lead_entrada=date.today(),
        notas=f"Lead gerado automaticamente via link UTM do parceiro {partner.full_name}",
    )
    db.add(crm_client)
    db.commit()
    db.refresh(crm_client)

    logger.info(
        "public_lead_registered partner_id=%s lead_id=%s crm_client_id=%s city=%s",
        partner.id,
        lead.id,
        crm_client.id,
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


_MAX_ROWS = 500

_COL_ALIASES = {
    "nome": "nome",
    "name": "nome",
    "full_name": "nome",
    "email": "email",
    "e-mail": "email",
    "telefone": "phone",
    "phone": "phone",
    "fone": "phone",
    "whatsapp": "phone",
    "cidade": "cidade",
    "city": "cidade",
    "estado": "estado",
    "state": "estado",
    "uf": "estado",
}


def _parse_csv(content: bytes) -> list[dict]:
    text = content.decode("utf-8-sig", errors="replace")
    sample = text[:2048]
    sep = ";" if sample.count(";") >= sample.count(",") else ","
    reader = csv.DictReader(io.StringIO(text), delimiter=sep)
    return [row for row in reader]


def _parse_xlsx(content: bytes) -> list[dict]:
    import openpyxl
    wb = openpyxl.load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    ws = wb.worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return []
    headers = [str(h).strip().lower() if h is not None else "" for h in rows[0]]
    result = []
    for row in rows[1:]:
        result.append({headers[i]: (str(v).strip() if v is not None else "") for i, v in enumerate(row)})
    return result


def _normalise_row(raw: dict) -> dict:
    out: dict = {}
    for key, val in raw.items():
        canonical = _COL_ALIASES.get(key.strip().lower().replace(" ", "_"))
        if canonical and val:
            out[canonical] = val.strip()
    return out


@router.post("/upload", summary="Importar lista de leads (CSV/XLSX)")
def upload_leads(
    current: CurrentPartner,
    db: Session = Depends(get_db),
    file: UploadFile = File(...),
):
    if current.status != "ACTIVE":
        raise HTTPException(status_code=403, detail="Parceiro não está ativo.")

    content = file.file.read()
    filename = (file.filename or "").lower()

    if filename.endswith(".xlsx") or file.content_type in (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ):
        try:
            raw_rows = _parse_xlsx(content)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Erro ao ler XLSX: {exc}") from exc
    else:
        try:
            raw_rows = _parse_csv(content)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Erro ao ler CSV: {exc}") from exc

    if len(raw_rows) > _MAX_ROWS:
        raise HTTPException(
            status_code=400,
            detail=f"Limite de {_MAX_ROWS} linhas por upload. O arquivo contém {len(raw_rows)}.",
        )

    now = datetime.utcnow()
    expires = now + timedelta(days=180)
    criados = 0
    ignorados = 0
    erros: list[str] = []

    for idx, raw in enumerate(raw_rows, start=2):
        row = _normalise_row(raw)
        nome = row.get("nome", "").strip()
        if not nome:
            ignorados += 1
            erros.append(f"Linha {idx}: nome ausente — ignorado.")
            continue

        email = row.get("email") or None
        phone = row.get("phone") or None

        lead = models.Lead(
            partner_id=current.id,
            full_name=nome,
            cpf=None,
            email=email,
            phone=phone,
            address_city=row.get("cidade") or None,
            address_state=(row.get("estado") or "")[:2].upper() or None,
            utm_code=current.utm_code,
            utm_source="upload",
            utm_medium="lista",
            lgpd_consent=True,
            lgpd_consent_at=now,
            status="CONTACTED",
            attribution_expires_at=expires,
            created_at=now,
            updated_at=now,
        )
        db.add(lead)
        try:
            db.flush()
            criados += 1
        except Exception:
            db.rollback()
            ignorados += 1
            erros.append(f"Linha {idx}: {nome} — e-mail ou dado duplicado, ignorado.")

    db.commit()
    logger.info("upload_leads partner_id=%s criados=%s ignorados=%s", current.id, criados, ignorados)
    return {"criados": criados, "ignorados": ignorados, "erros": erros}


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
