from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class SessionCreate(BaseModel):
    threshold: float = 0.7
    start: Optional[datetime] = None
    end: Optional[datetime] = None

class SessionResponse(BaseModel):
    id: int
    task_id: int
    threshold: float
    start: datetime
    end: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class RecognizedHuman(BaseModel):
    human_id: int
    name: str
    confidence: float
    attended: bool
    bbox: Optional[List[int]] = None

class RecognizeResponse(BaseModel):
    recognized: List[RecognizedHuman]
    unrecognized: int
    frame: Optional[str] = None
    crop_faces: Optional[List[str]] = None

class HumanReportDetail(BaseModel):
    human_id: int
    name: str
    attended: bool
    first_detected: Optional[str] = None
    detection_count: int

class SessionReportResponse(BaseModel):
    session_id: int
    total: int
    attended: int
    absent: int
    attendance_rate: float
    details: List[HumanReportDetail]

class TaskReportResponse(BaseModel):
    task_id: int
    task_name: str
    total_sessions: int
    overall_attendance_rate: float
