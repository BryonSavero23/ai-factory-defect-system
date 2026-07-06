from pydantic import BaseModel
from datetime import datetime


class QDNRead(BaseModel):
    id: int
    inspection_id: int
    lot_id: str
    machine_id: str
    reason: str
    containment_status: str
    created_at: datetime