from pydantic import BaseModel
from datetime import datetime


class InspectionRead(BaseModel):
    id: int
    lot_id: str
    machine_id: str
    image_path: str
    defect_type: str
    confidence: float
    status: str
    created_at: datetime