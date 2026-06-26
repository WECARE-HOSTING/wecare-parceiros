"""
Script para criar o primeiro usuário administrador.

Uso:
    uv run python scripts/create_admin.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.models.parceria import Partner

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./wecare_parceiros.db")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg2" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(DATABASE_URL)

print("=== Criar Administrador WeCare Parceiros ===")
print(f"Banco: {DATABASE_URL[:40]}...")
print()

full_name = input("Nome completo: ").strip()
email = input("E-mail: ").strip()
document = input("CPF (somente números): ").strip()
password = input("Senha: ").strip()

if not all([full_name, email, document, password]):
    print("Erro: todos os campos são obrigatórios.")
    sys.exit(1)

utm_code = f"admin_{document[-4:]}"
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

with Session(engine) as session:
    existing = session.query(Partner).filter(Partner.email == email).first()
    if existing:
        print(f"Erro: já existe um parceiro com o e-mail {email}.")
        sys.exit(1)

    existing_doc = session.query(Partner).filter(Partner.document == document).first()
    if existing_doc:
        print(f"Erro: já existe um parceiro com o CPF {document}.")
        sys.exit(1)

    admin = Partner(
        full_name=full_name,
        document=document,
        document_type="CPF",
        email=email,
        utm_code=utm_code,
        referral_url=f"{frontend_url}/cadastro?utm_campaign={utm_code}",
        status="ACTIVE",
        hashed_password=hash_password(password),
        is_admin=True,
        must_change_password=False,
    )
    session.add(admin)
    session.commit()
    session.refresh(admin)

    print()
    print(f"Admin criado! ID: {admin.id}")
    print(f"E-mail: {admin.email}")
    print(f"Nome: {admin.full_name}")
