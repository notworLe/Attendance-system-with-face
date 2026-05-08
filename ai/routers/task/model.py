from db.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

class Task(Base):
    __tablename__ = 'task'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now)


    user_id = Column(ForeignKey('user.id'), nullable=False)
    user = relationship('User', back_populates='tasks')
    task_humans = relationship('TaskHuman', back_populates='task')

class TaskHuman(Base):
    __tablename__ = 'task_human'

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(ForeignKey('task.id'), nullable=False)
    human_id = Column(ForeignKey('human.id'), nullable=False)

    task = relationship('Task', back_populates='task_humans')
    human = relationship('Human', back_populates='task_humans')
    logs = relationship('TaskHumanLog', back_populates='task_human')

class TaskHumanLog(Base):
    __tablename__ = 'task_human_log'

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_human_id = Column(ForeignKey('task_human.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    task_human = relationship('TaskHuman', back_populates='logs')






