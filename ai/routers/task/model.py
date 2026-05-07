from db.db import Base
from sqlalchemy import Column, Integer
from sqlalchemy.orm import relationship
from routers.human.model import Human

# class Task(Base):
#     __tablename__ = 'session_task'
#
#     id = Column(Integer, primary_key=True, autoincrement=True)
#
#     humans = relationship('Human', back_populates='task')

# class TaskHuman(Base):
#     __tablename__ = 'TaskHuman'








