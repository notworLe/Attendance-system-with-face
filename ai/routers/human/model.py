from db.db import Base
from sqlalchemy import Column, Integer, String
from pgvector.sqlalchemy import Vector


class Human(Base):
    __tablename__ = "human"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    embedding = Column(Vector(512))
