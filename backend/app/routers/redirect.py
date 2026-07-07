from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

router = APIRouter(tags=["Redirect"])


@router.get("/r/{short_code}", include_in_schema=False)
def redirect_short_link(short_code: str, db: Session = Depends(get_db)):
    partner = db.scalar(select(models.Partner).where(models.Partner.short_code == short_code))
    if not partner:
        raise HTTPException(status_code=404, detail="Link não encontrado.")
    return RedirectResponse(url=partner.referral_url, status_code=301)
