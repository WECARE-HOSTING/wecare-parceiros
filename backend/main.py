import logging
import os
import time
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.database import Base, engine
from app.tasks import expire_leads_job
from app.routers import (
    admin,
    auth,
    commissions,
    leads,
    materials,
    notifications as notifications_router,
    partners,
    properties,
    revenue,
)
from app import models
from app.auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        insp = inspect(conn)
        partner_columns = {col["name"] for col in insp.get_columns("partners")}

        if "must_change_password" not in partner_columns:
            conn.execute(text(
                "ALTER TABLE partners ADD COLUMN "
                "must_change_password BOOLEAN NOT NULL DEFAULT TRUE"
            ))
        if "term_accepted_at" not in partner_columns:
            conn.execute(text("ALTER TABLE partners ADD COLUMN term_accepted_at TIMESTAMP"))
        if "term_ip" not in partner_columns:
            conn.execute(text("ALTER TABLE partners ADD COLUMN term_ip VARCHAR(45)"))
        if "term_version" not in partner_columns:
            conn.execute(text("ALTER TABLE partners ADD COLUMN term_version VARCHAR(20)"))
        if "documents" not in partner_columns:
            conn.execute(text("ALTER TABLE partners ADD COLUMN documents JSON"))

        conn.commit()

    scheduler = BackgroundScheduler()
    scheduler.add_job(expire_leads_job, "cron", hour=2, minute=0, id="expire_leads")
    scheduler.start()
    logger.info("Scheduler iniciado.")

    yield

    scheduler.shutdown()
    logger.info("Scheduler encerrado.")


app = FastAPI(
    title="WeCare Parceiros",
    description="API do Programa de Parceria WeCare Hosting.",
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=[
        {"name": "Auth",       "description": "Login e autenticação"},
        {"name": "Admin",      "description": "Painel global de administração"},
        {"name": "Parceiros",  "description": "Cadastro e gestão de parceiros"},
        {"name": "Leads",      "description": "Indicações e rastreamento UTM"},
        {"name": "Imóveis",    "description": "Ciclo de vida dos imóveis indicados"},
        {"name": "Receita",    "description": "Registro mensal de receita"},
        {"name": "Comissões",  "description": "Apuração e pagamento de comissões"},
    ],
)

_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_dir = Path(os.getenv("UPLOADS_DIR", "./uploads"))
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
    started = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "request_completed method=%s path=%s status=%s elapsed_ms=%s request_id=%s",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
        request_id,
    )
    return response


@app.get("/health", tags=["Health"], include_in_schema=False)
def health():
    return {"status": "ok"}


BOOTSTRAP_TOKEN = os.getenv("BOOTSTRAP_TOKEN", "")


@app.post("/setup/bootstrap-admin", include_in_schema=False)
def bootstrap_admin(token: str):
    if not BOOTSTRAP_TOKEN or token != BOOTSTRAP_TOKEN:
        raise HTTPException(status_code=403, detail="Token inválido.")
    with Session(engine) as db:
        existing = db.query(models.Partner).filter(models.Partner.is_admin == True).first()
        if existing:
            return {"detail": f"Admin já existe: {existing.email}"}
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        admin_user = models.Partner(
            full_name="Felipe Malveira",
            document="00000000191",
            document_type="CPF",
            email="felipe@wecarehosting.com.br",
            utm_code="admin_0191",
            referral_url=f"{frontend_url}/indicar?utm_campaign=admin_0191",
            status="ACTIVE",
            hashed_password=hash_password("Wecare@2026"),
            is_admin=True,
            must_change_password=False,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        return {"detail": "Admin criado.", "id": admin_user.id, "email": admin_user.email}


@app.post("/setup/create-admin", include_in_schema=False)
def create_admin(token: str, full_name: str, email: str, document: str):
    if not BOOTSTRAP_TOKEN or token != BOOTSTRAP_TOKEN:
        raise HTTPException(status_code=403, detail="Token inválido.")
    from app.utils import generate_utm_code, infer_document_type
    document_digits = "".join(c for c in document if c.isdigit())
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    with Session(engine) as db:
        existing = db.query(models.Partner).filter(models.Partner.email == email).first()
        if existing:
            return {"detail": f"Usuário já existe: {existing.email}"}
        utm_code = generate_utm_code(db)
        partner = models.Partner(
            full_name=full_name,
            document=document_digits,
            document_type=infer_document_type(document_digits),
            email=email,
            utm_code=utm_code,
            referral_url=f"{frontend_url}/indicar?utm_campaign={utm_code}",
            status="ACTIVE",
            hashed_password=hash_password("Wecare@2026"),
            is_admin=True,
            must_change_password=True,
        )
        db.add(partner)
        db.commit()
        db.refresh(partner)
        return {"detail": "Admin criado.", "id": partner.id, "email": partner.email}


API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(admin.router, prefix=API_PREFIX)
app.include_router(partners.router, prefix=API_PREFIX)
app.include_router(leads.router, prefix=API_PREFIX)
app.include_router(properties.router, prefix=API_PREFIX)
app.include_router(revenue.router, prefix=API_PREFIX)
app.include_router(commissions.router, prefix=API_PREFIX)
app.include_router(notifications_router.router, prefix=API_PREFIX)
app.include_router(materials.router, prefix=API_PREFIX)
