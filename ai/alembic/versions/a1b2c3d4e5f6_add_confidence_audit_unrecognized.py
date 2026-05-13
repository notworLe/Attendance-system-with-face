"""Add confidence, evidence, audit log, unrecognized face tables

Revision ID: a1b2c3d4e5f6
Revises: 35b470e5446b
Create Date: 2026-05-13 15:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '35b470e5446b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Thêm cột confidence + evidence vào task_human_session_log
    op.add_column('task_human_session_log',
        sa.Column('confidence', sa.Float(), nullable=True))
    op.add_column('task_human_session_log',
        sa.Column('evidence_image_path', sa.String(), nullable=True))

    # Tạo bảng attendance_audit_log
    op.create_table(
        'attendance_audit_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('old_value', sa.Boolean(), nullable=False),
        sa.Column('new_value', sa.Boolean(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('changed_at', sa.DateTime(), nullable=True),
        sa.Column('task_human_session_id', sa.Integer(),
                  sa.ForeignKey('task_human_session.id', ondelete='CASCADE'), nullable=False),
        sa.Column('changed_by', sa.String(), nullable=True),  # UUID as string
    )

    # Tạo bảng unrecognized_face_log
    op.create_table(
        'unrecognized_face_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('best_confidence', sa.Float(), nullable=True),
        sa.Column('evidence_image_path', sa.String(), nullable=True),
        sa.Column('task_session_id', sa.Integer(),
                  sa.ForeignKey('task_session.id', ondelete='CASCADE'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('unrecognized_face_log')
    op.drop_table('attendance_audit_log')
    op.drop_column('task_human_session_log', 'evidence_image_path')
    op.drop_column('task_human_session_log', 'confidence')
