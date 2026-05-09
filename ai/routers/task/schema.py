from pydantic import BaseModel, Field
from datetime import datetime
from routers.human.schema import HumanDisplay

class TaskCreate(BaseModel):
    name: str

class TaskUpdate(BaseModel):
    name: str

class TaskResponse(BaseModel):
    id: int
    name: str
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

