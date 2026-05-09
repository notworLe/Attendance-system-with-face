from pydantic import BaseModel
import uuid

class HumanCreate(BaseModel):
    name: str
    # embedding: list[float]

class HumanUpdate(BaseModel):
    name: str

class HumanDisplay(BaseModel):
    id: int
    name: str
    # embedding: list[float]

    class Config:
        from_attributes = True

