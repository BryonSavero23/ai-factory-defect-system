from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import QDNRecord

router = APIRouter(
    prefix="/qdn",
    tags=["QDN"]
)


@router.get("/")
def get_qdn_records(session: Session = Depends(get_session)):
    statement = select(QDNRecord).order_by(QDNRecord.created_at.desc())
    qdn_records = session.exec(statement).all()
    return qdn_records