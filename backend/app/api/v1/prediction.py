import os
import shutil
from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlmodel import Session

from app.services.cv_service import predict_defect
from app.services.qdn_service import evaluate_qdn_requirement
from app.db.database import get_session
from app.db.models import Inspection, QDNRecord

router = APIRouter(
    prefix="/predict",
    tags=["Prediction"]
)

UPLOAD_DIR = "app/uploads"


@router.post("/")
async def predict_image(
    file: UploadFile = File(...),
    lot_id: str = Form(...),
    machine_id: str = Form(...),
    session: Session = Depends(get_session)
):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    prediction = predict_defect(file.filename)
    qdn_result = evaluate_qdn_requirement(prediction)

    inspection = Inspection(
        lot_id=lot_id,
        machine_id=machine_id,
        image_path=file_path,
        defect_type=prediction["defect_type"],
        confidence=prediction["confidence"],
        status=prediction["status"]
    )

    session.add(inspection)
    session.commit()
    session.refresh(inspection)

    qdn_record = None

    if qdn_result["qdn_required"]:
        qdn_record = QDNRecord(
            inspection_id=inspection.id,
            lot_id=lot_id,
            machine_id=machine_id,
            reason=qdn_result["reason"],
            containment_status=qdn_result["containment_status"]
        )

        session.add(qdn_record)
        session.commit()
        session.refresh(qdn_record)

    return {
        "message": "Inspection completed and saved",
        "inspection_id": inspection.id,
        "lot_id": lot_id,
        "machine_id": machine_id,
        "image_path": file_path,
        "prediction": prediction,
        "qdn": qdn_result,
        "qdn_record_id": qdn_record.id if qdn_record else None
    }