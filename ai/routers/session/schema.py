from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any


class SessionCreate(BaseModel):
    threshold: float = 0.7
    start: Optional[datetime] = None
    end: Optional[datetime] = None
    note: Optional[str] = None


class SessionStatusUpdate(BaseModel):
    status: str


class SessionResponse(BaseModel):
    id: int
    task_id: int
    threshold: float
    start: datetime
    end: datetime
    status: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class RecognizedHuman(BaseModel):
    human_id: int
    name: str
    confidence: float
    attended: bool
    bbox: Optional[List[float]] = None


class RecognizeResponse(BaseModel):
    recognized: List[RecognizedHuman]
    unrecognized: int
    frame: Optional[str] = None
    crop_faces: Optional[List[str]] = None


class AuditLogEntry(BaseModel):
    old_value: bool
    new_value: bool
    reason: str
    changed_at: str


class HumanReportDetail(BaseModel):
    task_human_session_id: int
    human_id: int
    name: str
    attended: bool
    first_detected: Optional[str] = None
    last_detected: Optional[str] = None
    detection_count: int
    manually_edited: bool = False
    audit_logs: List[AuditLogEntry] = []


class SessionReportResponse(BaseModel):
    session_id: int
    total: int
    attended: int
    absent: int
    attendance_rate: float
    status: str
    note: Optional[str] = None
    details: List[HumanReportDetail]


class TaskReportResponse(BaseModel):
    task_id: int
    task_name: str
    total_sessions: int
    overall_attendance_rate: float
