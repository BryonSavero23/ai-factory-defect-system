from pydantic import BaseModel
from typing import Optional


class PredictionResult(BaseModel):
    filename: str
    defect_type: str
    confidence: float
    status: str


class QDNResult(BaseModel):
    qdn_required: bool
    containment_status: str
    reason: str


class PredictionResponse(BaseModel):
    message: str
    inspection_id: int
    lot_id: str
    machine_id: str
    image_path: str
    prediction: PredictionResult
    qdn: QDNResult
    qdn_record_id: Optional[int]