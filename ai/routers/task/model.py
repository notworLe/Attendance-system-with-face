from db.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta


class Task(Base):
    __tablename__ = 'task'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


    user_id = Column(ForeignKey('user.id'), nullable=False)

    user = relationship('User', back_populates='tasks') # 1
    task_sessions = relationship('TaskSession', back_populates='task') # Many
    task_humans = relationship('TaskHuman', back_populates='task') # Many

class TaskHuman(Base):
    __tablename__ = 'task_human'

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(ForeignKey('task.id'), nullable=False)
    human_id = Column(ForeignKey('human.id'), nullable=False)

    task = relationship('Task', back_populates='task_humans') # 1
    human = relationship('Human', back_populates='task_humans') # 1
    task_human_sessions = relationship('TaskHumanSession', back_populates='task_human') # Many


class TaskSession(Base):
    __tablename__ = 'task_session'

    id = Column(Integer, primary_key=True, autoincrement=True)
    threshold = Column(Float, default=0.7)
    start = Column(DateTime, default=datetime.now)
    end = Column(DateTime, default=lambda: datetime.now() + timedelta(minutes=120))
    status = Column(String, default="PENDING")
    created_at = Column(DateTime, default=datetime.now)
    task_id = Column(ForeignKey('task.id'))

    task = relationship('Task', back_populates='task_sessions') #
    task_human_sessions = relationship('TaskHumanSession', back_populates='task_session') #

class TaskHumanSession(Base):
    __tablename__ = 'task_human_session'

    id = Column(Integer, primary_key=True, autoincrement=True)
    attended = Column(Boolean, default=False)

    task_session_id = Column(ForeignKey('task_session.id'), nullable=False)
    task_human_id = Column(ForeignKey('task_human.id'), nullable=False)

    task_human = relationship('TaskHuman', back_populates='task_human_sessions') # 1
    task_session = relationship('TaskSession', back_populates='task_human_sessions') # 1
    task_human_session_logs = relationship('TaskHumanSessionLog', back_populates='task_human_session') # Many

class TaskHumanSessionLog(Base):
    __tablename__ = 'task_human_session_log'

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.now)

    task_human_session_id = Column(ForeignKey('task_human_session.id'), nullable=False)

    task_human_session = relationship("TaskHumanSession", back_populates='task_human_session_logs')