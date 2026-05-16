from pydantic import BaseModel, Field
from datetime import datetime
from routers.human.schema import HumanDisplay
from uuid import UUID

class TaskCreate(BaseModel):
    name: str
    teacher_id: UUID | None = None
    start_date: datetime | None = None
    shift: int | None = None
    num_sessions: int | None = None

class TaskUpdate(BaseModel):
    name: str
    teacher_id: UUID | None = None

class TaskResponse(BaseModel):
    id: int
    name: str
    teacher_id: UUID | None
    created_at: datetime
    updated_at: datetime



class TaskHumanDisplay(BaseModel):
    human: HumanDisplay

    # Allow read object
    class Config:
        from_attributes = True

class TaskDisplay(BaseModel):
    id: int
    name: str
    teacher_id: UUID | None
    created_at: datetime
    updated_at: datetime
    task_humans: list[TaskHumanDisplay] = []

    # Allow read object
    class Config:
        from_attributes = True


class TaskHumanCreate(BaseModel):
    id: int
    task_id: int
    human_id: int


class TaskHumanSessionCreate(BaseModel):
    task_id: int

