import os
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import bcrypt
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

SECRET_KEY = os.getenv("SECRET_KEY", "wecare-dev-secret-TROQUE-EM-PRODUCAO")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("TOKEN_EXPIRE_HOURS", "8"))
RESET_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def create_access_token(partner_id: int, is_admin: bool = False) -> str:
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": str(partner_id), "admin": is_admin, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_partner(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
) -> models.Partner:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    partner_id = payload.get("sub")
    if not partner_id:
        raise HTTPException(status_code=401, detail="Token sem identidade.")

    partner = db.get(models.Partner, int(partner_id))
    if not partner or partner.status == "TERMINATED":
        raise HTTPException(status_code=401, detail="Parceiro não encontrado ou encerrado.")
    return partner


def require_admin(
    current: Annotated[models.Partner, Depends(get_current_partner)],
) -> models.Partner:
    if not current.is_admin:
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores.")
    return current


def create_reset_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email, "type": "reset", "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_reset_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=400, detail="Link inválido ou expirado.")
    if payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Token inválido.")
    email = payload.get("sub")
    if not email:
        raise HTTPException(status_code=400, detail="Token sem identidade.")
    return email


CurrentPartner = Annotated[models.Partner, Depends(get_current_partner)]
AdminPartner = Annotated[models.Partner, Depends(require_admin)]
