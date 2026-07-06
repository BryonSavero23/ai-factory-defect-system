from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.database import get_session
from app.db.models import Inspection
from app.schemas.inspection import InspectionRead

router = APIRouter(
    prefix="/inspections",
    tags=["Inspections"]
)


@router.get("/", response_model=List[InspectionRead])
def get_inspections(session: Session = Depends(get_session)):
    statement = select(Inspection).order_by(Inspection.created_at.desc())
    inspections = session.exec(statement).all()
    return inspections