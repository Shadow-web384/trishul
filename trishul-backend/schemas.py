from typing import Optional
from pydantic import BaseModel


class Anomaly(BaseModel):
    type: str
    severity: str
    message: str
    value: Optional[float] = None


class InvestigationReport(BaseModel):
    summary: str
    key_findings: list[str]
    risk_explanation: str
    recommended_actions: list[str]
    priority: str


class ProjectResponse(BaseModel):
    project_id: str
    project_name: str
    state: str
    district: str
    sector: str

    sanctioned_amount: float
    released_amount: float
    utilized_amount: float

    physical_progress: float
    financial_progress: float

    status: str
    inspection_status: str
    last_inspection_days: int

    risk_score: int
    severity: str
    anomalies: list[Anomaly]


class InvestigationResponse(BaseModel):
    project_id: str
    project_name: str
    risk_score: int
    severity: str
    anomalies: list[Anomaly]
    investigation_report: InvestigationReport