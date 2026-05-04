from pydantic import BaseModel, Field


class Student(BaseModel):
    name: str = Field(max_length=20)

class Classes(BaseModel):
    id: str = Field()

class StudentClasses(BaseModel):
    student: Student
    classes: Classes


class Session(BaseModel):
    id: str = Field()
    id_class: Classes
    picture: Image