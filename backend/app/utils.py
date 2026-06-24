import secrets
import string
from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models


def generate_temp_password() -> str:
    chars = string.ascii_uppercase + string.digits
    return "WCare@" + "".join(secrets.choice(chars) for _ in range(6))


def generate_utm_code(db: Session) -> str:
    for _ in range(10):
        code = "ref_" + secrets.token_hex(4)
        if not db.scalar(select(models.Partner).where(models.Partner.utm_code == code)):
            return code
    raise RuntimeError("Não foi possível gerar UTM code único.")


def infer_document_type(document: str) -> str:
    return "CPF" if len(document) == 11 else "CNPJ"


def calculate_commission(
    prop: models.Property, record: models.RevenueRecord
) -> Decimal:
    admin_fee = Decimal(str(record.wecare_admin_fee))
    gross = Decimal(str(record.gross_revenue))

    if prop.contract_model == "A":
        return admin_fee
    elif prop.contract_model == "B":
        fixed = Decimal(str(prop.model_b_fixed_monthly or 0))
        pct = Decimal(str(prop.model_b_revenue_pct or 0))
        return fixed + (gross * pct)
    elif prop.contract_model == "C":
        return Decimal(str(prop.model_c_first_allocation or 0))

    raise ValueError(f"Modelo de contrato desconhecido: {prop.contract_model}")


def commission_due_date(year: int, month: int) -> date:
    return date(year + 1, 1, 10) if month == 12 else date(year, month + 1, 10)


def fmt_brl(value) -> str:
    return (
        f"R$ {Decimal(str(value)):,.2f}"
        .replace(",", "X")
        .replace(".", ",")
        .replace("X", ".")
    )
