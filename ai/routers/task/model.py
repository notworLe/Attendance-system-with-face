from db.db import Base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

class Task(Base):
    __tablename__ = 'session_task'

    id = Column(Integer, primary_key=True, autoincrement=True)

    humans = relationship('Human', back_populates=)

class TaskHuman(Base):
    __tablename__ = 'TaskHuman'



class Human(Base):
    __tablename__ = "human"

    id = Column(Integer, primary_key=, autoincrement=True)
    name = Column(String, nullable=False)
    embedding = Column(Vector(512))




