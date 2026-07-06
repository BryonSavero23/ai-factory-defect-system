from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_inspections: int
    total_defects: int
    total_pass: int
    defect_rate_percent: float
    total_qdn: int
    lots_on_hold: list[str]
    top_defect_type: str | None


class DefectBreakdownItem(BaseModel):
    defect_type: str
    count: int


class MachineBreakdownItem(BaseModel):
    machine_id: str
    inspection_count: int