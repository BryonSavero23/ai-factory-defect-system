from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from app.db.database import get_session
from app.db.models import Inspection, QDNRecord

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def get_dashboard_summary(session: Session = Depends(get_session)):
    total_inspections = session.exec(
        select(func.count(Inspection.id))
    ).one()

    total_defects = session.exec(
        select(func.count(Inspection.id)).where(Inspection.status == "DEFECT")
    ).one()

    total_pass = session.exec(
        select(func.count(Inspection.id)).where(Inspection.status == "PASS")
    ).one()

    total_qdn = session.exec(
        select(func.count(QDNRecord.id))
    ).one()

    defect_rate = 0
    if total_inspections > 0:
        defect_rate = round((total_defects / total_inspections) * 100, 2)

    lots_on_hold = session.exec(
        select(QDNRecord.lot_id).distinct()
    ).all()

    top_defect_result = session.exec(
        select(Inspection.defect_type, func.count(Inspection.id))
        .where(Inspection.defect_type != "no_defect")
        .group_by(Inspection.defect_type)
        .order_by(func.count(Inspection.id).desc())
    ).first()

    top_defect_type = top_defect_result[0] if top_defect_result else None

    return {
        "total_inspections": total_inspections,
        "total_defects": total_defects,
        "total_pass": total_pass,
        "defect_rate_percent": defect_rate,
        "total_qdn": total_qdn,
        "lots_on_hold": lots_on_hold,
        "top_defect_type": top_defect_type
    }


@router.get("/defect-breakdown")
def get_defect_breakdown(session: Session = Depends(get_session)):
    results = session.exec(
        select(Inspection.defect_type, func.count(Inspection.id))
        .where(Inspection.defect_type != "no_defect")
        .group_by(Inspection.defect_type)
        .order_by(func.count(Inspection.id).desc())
    ).all()

    return [
        {
            "defect_type": defect_type,
            "count": count
        }
        for defect_type, count in results
    ]


@router.get("/machine-breakdown")
def get_machine_breakdown(session: Session = Depends(get_session)):
    results = session.exec(
        select(Inspection.machine_id, func.count(Inspection.id))
        .group_by(Inspection.machine_id)
        .order_by(func.count(Inspection.id).desc())
    ).all()

    return [
        {
            "machine_id": machine_id,
            "inspection_count": count
        }
        for machine_id, count in results
    ]