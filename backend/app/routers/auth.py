import os
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, notifications, schemas
from app.auth import (
    CurrentPartner,
    create_access_token,
    create_reset_token,
    hash_password,
    verify_password,
    verify_reset_token,
)
from app.database import get_db

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", summary="Login do parceiro")
def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    partner = db.scalar(
        select(models.Partner).where(models.Partner.email == form.username)
    )
    if not partner or not partner.hashed_password:
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    if not verify_password(form.password, partner.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas.")
    if partner.status == "TERMINATED":
        raise HTTPException(status_code=403, detail="Conta encerrada.")

    token = create_access_token(partner.id, partner.is_admin)
    return {
        "access_token": token,
        "token_type": "bearer",
        "partner_id": partner.id,
        "must_change_password": partner.must_change_password,
    }


@router.get("/me", response_model=schemas.PartnerResponse, summary="Dados do parceiro autenticado")
def me(current: CurrentPartner):
    return current


@router.post("/forgot-password", summary="Solicitar redefinição de senha")
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    partner = db.scalar(select(models.Partner).where(models.Partner.email == str(payload.email)))
    if not partner or partner.status == "TERMINATED":
        raise HTTPException(status_code=404, detail="E-mail não encontrado. Verifique o endereço e tente novamente.")
    token = create_reset_token(partner.email)
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    notifications.notify_password_reset(partner.email, partner.full_name, reset_link)
    return {"detail": "Instruções de redefinição enviadas para o seu e-mail."}


@router.post("/reset-password", summary="Redefinir senha com token")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    email = verify_reset_token(payload.token)
    partner = db.scalar(select(models.Partner).where(models.Partner.email == email))
    if not partner or partner.status == "TERMINATED":
        raise HTTPException(status_code=400, detail="Conta não encontrada ou encerrada.")
    partner.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Senha redefinida com sucesso. Você já pode fazer login."}


@router.post("/change-password", summary="Trocar senha (autenticado)")
def change_password(
    payload: schemas.ChangePasswordRequest,
    current: CurrentPartner,
    db: Session = Depends(get_db),
):
    if not current.must_change_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="Senha atual obrigatória.")
        if not current.hashed_password or not verify_password(
            payload.current_password, current.hashed_password
        ):
            raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    current.hashed_password = hash_password(payload.new_password)
    current.must_change_password = False
    db.commit()
    return {"detail": "Senha alterada com sucesso."}
