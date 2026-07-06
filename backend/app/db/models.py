from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field


class Inspection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    lot_id: str
    machine_id: str
    image_path: str
    defect_type: str
    confidence: float
    status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QDNRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    inspection_id: int
    lot_id: str
    machine_id: str
    reason: str
    containment_status: str
    created_at: datetime = Field(default_factory=datetime.utcnow)