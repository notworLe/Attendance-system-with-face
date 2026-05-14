from db.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey
from pgvector.sqlalchemy import Vector
from sqlalchemy.orm import relationship

class Human(Base):
    __tablename__ = "human"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    embedding = Column(Vector(512))

    user_id = Column(ForeignKey('user.id'), nullable=False)

    user = relationship('User', back_populates='humans')
    task_humans = relationship('TaskHuman', back_populates='human', cascade="all, delete-orphan")