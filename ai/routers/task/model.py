from db.db import Base
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta


class Task(Base):
    __tablename__ = 'task'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    user_id = Column(ForeignKey('user.id'), nullable=False)

    user = relationship('User', back_populates='tasks')
    task_sessions = relationship('TaskSession', back_populates='task', cascade="all, delete-orphan")
    task_humans = relationship('TaskHuman', back_populates='task', cascade="all, delete-orphan")


class TaskHuman(Base):
    __tablename__ = 'task_human'

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(ForeignKey('task.id', ondelete='CASCADE'), nullable=False)
    human_id = Column(ForeignKey('human.id', ondelete='CASCADE'), nullable=False)

    task = relationship('Task', back_populates='task_humans')
    human = relationship('Human', back_populates='task_humans')
    task_human_sessions = relationship('TaskHumanSession', back_populates='task_human', cascade="all, delete-orphan")


class TaskSession(Base):
    __tablename__ = 'task_session'

    id = Column(Integer, primary_key=True, autoincrement=True)
    threshold = Column(Float, default=0.7)
    start = Column(DateTime, default=datetime.now)
    end = Column(DateTime, default=lambda: datetime.now() + timedelta(minutes=120))
    status = Column(String, default="PENDING")
    note = Column(String, nullable=True) # Check-in, Check-out
    created_at = Column(DateTime, default=datetime.now)
    task_id = Column(ForeignKey('task.id', ondelete='CASCADE'))

    task = relationship('Task', back_populates='task_sessions')
    task_human_sessions = relationship('TaskHumanSession', back_populates='task_session', cascade="all, delete-orphan")
    unrecognized_face_logs = relationship('UnrecognizedFaceLog', back_populates='task_session', cascade="all, delete-orphan")


class TaskHumanSession(Base):
    __tablename__ = 'task_human_session'

    id = Column(Integer, primary_key=True, autoincrement=True)
    attended = Column(Boolean, default=False)
    hit_count = Column(Integer, default=0)

    task_session_id = Column(ForeignKey('task_session.id', ondelete='CASCADE'), nullable=False)
    task_human_id = Column(ForeignKey('task_human.id', ondelete='CASCADE'), nullable=False)

    task_human = relationship('TaskHuman', back_populates='task_human_sessions')
    task_session = relationship('TaskSession', back_populates='task_human_sessions')
    task_human_session_logs = relationship('TaskHumanSessionLog', back_populates='task_human_session', cascade="all, delete-orphan")
    attendance_audit_logs = relationship('AttendanceAuditLog', back_populates='task_human_session', cascade="all, delete-orphan")


class TaskHumanSessionLog(Base):
    """Log mỗi lần AI nhận diện thành công (có thể nhiều lần/buổi)."""
    __tablename__ = 'task_human_session_log'

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.now)
    confidence = Column(Float, nullable=True)            # Điểm cosine similarity lúc nhận diện
    evidence_image_path = Column(String, nullable=True)  # Đường dẫn ảnh crop khuôn mặt

    task_human_session_id = Column(ForeignKey('task_human_session.id', ondelete='CASCADE'), nullable=False)
    task_human_session = relationship("TaskHumanSession", back_populates='task_human_session_logs')


class AttendanceAuditLog(Base):
    """
    Ghi lại MỌI thao tác sửa thủ công điểm danh của giảng viên.
    Không xóa được — bằng chứng minh bạch.
    """
    __tablename__ = 'attendance_audit_log'

    id = Column(Integer, primary_key=True, autoincrement=True)
    old_value = Column(Boolean, nullable=False)   # Trạng thái trước khi sửa
    new_value = Column(Boolean, nullable=False)   # Trạng thái sau khi sửa
    reason = Column(Text, nullable=False)         # Lý do bắt buộc phải nhập
    changed_at = Column(DateTime, default=datetime.now)

    task_human_session_id = Column(ForeignKey('task_human_session.id', ondelete='CASCADE'), nullable=False)
    changed_by = Column(ForeignKey('user.id', ondelete='SET NULL'), nullable=True)

    task_human_session = relationship('TaskHumanSession', back_populates='attendance_audit_logs')


class UnrecognizedFaceLog(Base):
    """
    Lưu khuôn mặt phát hiện được nhưng KHÔNG nhận ra ai.
    Giáo viên có thể xem lại và gán thủ công cho học sinh.
    """
    __tablename__ = 'unrecognized_face_log'

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime, default=datetime.now)
    best_confidence = Column(Float, nullable=True)       # Điểm cao nhất đạt được (dù không qua threshold)
    evidence_image_path = Column(String, nullable=True)  # Ảnh crop khuôn mặt lưu trên disk

    task_session_id = Column(ForeignKey('task_session.id', ondelete='CASCADE'), nullable=False)
    task_session = relationship("TaskSession", back_populates='unrecognized_face_logs')