from pydantic import BaseModel, Field

class Human(BaseModel):
    name: str = Field(max_length=20)
    embedding: str


class SessionTasks(BaseModel):
    id: str = Field()
    students: list[Human]