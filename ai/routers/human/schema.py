from pydantic import BaseModel
import uuid

class HumanCreate(BaseModel):
    name: str
    embedding: list[float]


class HumanResponse(BaseModel):
    id: int
    user_id: uuid.UUID
    name: str
    embedding: list[float]

    class Config:
        from_attributes = True

