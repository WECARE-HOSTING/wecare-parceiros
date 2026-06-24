import os
import uuid
from datetime import datetime
import logging
from pathlib import Path
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import AdminPartner, CurrentPartner
from app.database import get_db

router = APIRouter(prefix="/materials", tags=["Materiais"])
logger = logging.getLogger(__name__)
UPLOADS_DIR = Path(os.getenv("UPLOADS_DIR", "./uploads"))
MATERIALS_DIR = UPLOADS_DIR / "materials"
_MAX_SIZE = 20 * 1024 * 1024  # 20MB
_ALLOWED_TYPES = {
    "application/pdf",
    "application/zip",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
}


def _extract_local_upload_path(file_url: str) -> Path | None:
    """
    Aceita URL absoluta ou relativa e retorna o path local em uploads/materials quando aplicável.
    """
    parsed_path = file_url
    if "://" in file_url:
        parsed_path = urlparse(file_url).path
    prefix = "/uploads/materials/"
    if not parsed_path.startswith(prefix):
        return None
    filename = parsed_path.removeprefix(prefix)
    if "/" in filename or "\\" in filename or ".." in filename:
        return None
    return MATERIALS_DIR / filename


@router.post("/upload", summary="Upload de arquivo de material (admin)")
async def upload_material_file(
    request: Request,
    file: UploadFile,
    _admin: AdminPartner,
):
    if file.content_type not in _ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail="Tipo de arquivo não permitido.")

    content = await file.read()
    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=422, detail="Arquivo muito grande. Limite: 20 MB.")

    ext = Path(file.filename or "material").suffix.lower() or ".bin"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    MATERIALS_DIR.mkdir(parents=True, exist_ok=True)
    target = MATERIALS_DIR / safe_name
    target.write_bytes(content)
    logger.info(
        "material_upload_saved admin_id=%s file_name=%s size_bytes=%s",
        _admin.id,
        file.filename or safe_name,
        len(content),
    )

    _ = request
    return {
        "file_url": f"/uploads/materials/{safe_name}",
        "file_name": file.filename or safe_name,
        "file_mime_type": file.content_type,
        "file_size_bytes": len(content),
    }


@router.post("", response_model=schemas.MaterialResponse, status_code=201, summary="Criar material (admin)")
def create_material(
    payload: schemas.MaterialCreate,
    admin: AdminPartner,
    db: Session = Depends(get_db),
):
    material = models.Material(
        title=payload.title,
        description=payload.description,
        category=payload.category,
        status="PUBLISHED",
        tags=payload.tags,
        file_url=payload.file_url,
        file_name=payload.file_name,
        file_mime_type=payload.file_mime_type,
        file_size_bytes=payload.file_size_bytes,
        created_by_partner_id=admin.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(material)
    db.commit()
    db.refresh(material)
    logger.info(
        "material_created user_id=%s material_id=%s category=%s",
        admin.id,
        material.id,
        material.category,
    )
    return material


@router.get("", response_model=list[schemas.MaterialResponse], summary="Listar materiais")
def list_materials(
    current: CurrentPartner,
    category: str | None = None,
    include_archived: bool = False,
    db: Session = Depends(get_db),
):
    query = select(models.Material)
    if not include_archived:
        query = query.where(models.Material.status == "PUBLISHED")
    if category:
        query = query.where(models.Material.category == category)
    _ = current
    return db.scalars(query.order_by(models.Material.created_at.desc())).all()


@router.post("/{material_id}/download", response_model=schemas.MaterialDownloadResponse, summary="Registrar download")
def download_material(
    material_id: int,
    current: CurrentPartner,
    db: Session = Depends(get_db),
):
    material = db.get(models.Material, material_id)
    if not material or material.status != "PUBLISHED":
        raise HTTPException(status_code=404, detail="Material não encontrado.")

    download = models.MaterialDownload(
        material_id=material.id,
        partner_id=current.id,
        downloaded_at=datetime.utcnow(),
    )
    db.add(download)
    db.commit()
    logger.info(
        "material_download_registered user_id=%s material_id=%s",
        current.id,
        material.id,
    )
    return schemas.MaterialDownloadResponse(material=material, download_url=material.file_url)


@router.delete("/{material_id}", summary="Arquivar material (admin)")
def delete_material(
    material_id: int,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    material = db.get(models.Material, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado.")

    # Soft delete para manter histórico de downloads e auditoria
    material.status = "ARCHIVED"
    material.updated_at = datetime.utcnow()
    db.commit()
    logger.info(
        "material_archived admin_id=%s material_id=%s",
        _admin.id,
        material.id,
    )

    return {"detail": "Material arquivado com sucesso."}


@router.post("/{material_id}/restore", summary="Desarquivar material (admin)")
def restore_material(
    material_id: int,
    _admin: AdminPartner,
    db: Session = Depends(get_db),
):
    material = db.get(models.Material, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material não encontrado.")

    local_path = _extract_local_upload_path(material.file_url)
    if local_path and not local_path.exists():
        raise HTTPException(
            status_code=422,
            detail="Arquivo original não encontrado para este material.",
        )

    material.status = "PUBLISHED"
    material.updated_at = datetime.utcnow()
    db.commit()
    logger.info(
        "material_restored admin_id=%s material_id=%s",
        _admin.id,
        material.id,
    )
    return {"detail": "Material restaurado com sucesso."}
