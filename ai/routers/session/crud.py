from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from datetime import datetime
import cv2
import numpy as np
import os
import uuid

from routers.task.model import (
    Task, TaskHuman, TaskSession, TaskHumanSession,
    TaskHumanSessionLog, AttendanceAuditLog, UnrecognizedFaceLog
)
from routers.human.model import Human
from .schema import SessionCreate
from ai_service.recognition import detection_embedding, cosine_similarity, draw_boxes_on_image, crop_faces_from_image
from .websockets import manager

EVIDENCE_DIR = "/app/ai/evidence"  # Mount volume này trong docker-compose


# ─── Session CRUD ────────────────────────────────────────────────────────────

async def create_session(task_id: int, session_data: SessionCreate, user_id: int, session: AsyncSession):
    task = await session.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    task = task.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    start_time = session_data.start.replace(tzinfo=None) if session_data.start else datetime.now()
    end_time = session_data.end.replace(tzinfo=None) if session_data.end else None

    new_session = TaskSession(
        task_id=task_id,
        threshold=session_data.threshold,
        start=start_time,
        end=end_time,
        status="ACTIVE"
    )
    session.add(new_session)
    await session.commit()
    await session.refresh(new_session)

    task_humans = await session.execute(select(TaskHuman).where(TaskHuman.task_id == task_id))
    task_humans = task_humans.scalars().all()

    for th in task_humans:
        ths = TaskHumanSession(
            task_session_id=new_session.id,
            task_human_id=th.id,
            attended=False
        )
        session.add(ths)
    
    await session.commit()
    return new_session


async def close_session(session_id: int, session: AsyncSession):
    task_session = await session.execute(select(TaskSession).where(TaskSession.id == session_id))
    task_session = task_session.scalars().first()
    if not task_session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    task_session.status = "CLOSED"
    await session.commit()
    return {"message": "Session closed"}


async def recognize_faces(session_id: int, image_bytes: bytes, draw_box: bool, crop_faces: bool, db: AsyncSession):
    stmt = select(TaskSession).where(TaskSession.id == session_id)
    result = await db.execute(stmt)
    task_session = result.scalars().first()
    
    if not task_session:
        raise HTTPException(status_code=404, detail="Session not found")
    if task_session.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Session is not ACTIVE")

    nparray = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparray, cv2.IMREAD_COLOR)

    detected_faces = detection_embedding(img)
    if not detected_faces:
        return {"recognized": [], "unrecognized": 0}

    stmt = select(TaskHumanSession).where(
        TaskHumanSession.task_session_id == session_id
    ).options(selectinload(TaskHumanSession.task_human).selectinload(TaskHuman.human))
    
    ths_result = await db.execute(stmt)
    task_human_sessions = ths_result.scalars().all()

    if not task_human_sessions:
        raise HTTPException(status_code=400, detail="No humans in this session")

    stored_embeddings = []
    ths_mapping = []
    for ths in task_human_sessions:
        if ths.task_human.human.embedding is not None:
            stored_embeddings.append(ths.task_human.human.embedding)
            ths_mapping.append(ths)

    recognized_list = []
    recognized_boxes = []
    unrecognized_boxes = []
    all_crop_boxes = []
    unrecognized_count = 0

    for face in detected_faces:
        face_embed = face.embedding
        all_crop_boxes.append(face.bbox)
        
        similarities = cosine_similarity(face_embed, stored_embeddings)
        best_match_idx = np.argmax(similarities)
        best_score = float(similarities[best_match_idx])

        # Crop khuôn mặt để lưu bằng chứng
        x1, y1, x2, y2 = face.bbox.astype(int)
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(img.shape[1], x2), min(img.shape[0], y2)
        face_crop = img[y1:y2, x1:x2]

        if best_score > task_session.threshold:
            matched_ths = ths_mapping[best_match_idx]

            # Lưu ảnh bằng chứng xuống disk
            evidence_path = _save_evidence_image(
                face_crop, folder=f"{EVIDENCE_DIR}/{session_id}/recognized"
            )

            new_log = TaskHumanSessionLog(
                task_human_session_id=matched_ths.id,
                confidence=best_score,
                evidence_image_path=evidence_path
            )
            db.add(new_log)
            matched_ths.attended = True
            
            recognized_list.append({
                "human_id": matched_ths.task_human.human.id,
                "name": matched_ths.task_human.human.name,
                "confidence": best_score,
                "attended": True,
                "bbox": face.bbox.tolist()
            })
            recognized_boxes.append((face.bbox, best_score, matched_ths.task_human.human.name))
            
            await manager.broadcast({
                "event": "human_recognized",
                "human_id": matched_ths.task_human.human.id,
                "name": matched_ths.task_human.human.name,
                "confidence": best_score
            }, session_id=session_id)
            
        else:
            # KHÔNG nhận ra: lưu lại để GV review thủ công
            unrecognized_count += 1
            unrecognized_boxes.append(face.bbox)

            evidence_path = _save_evidence_image(
                face_crop, folder=f"{EVIDENCE_DIR}/{session_id}/unrecognized"
            )
            db.add(UnrecognizedFaceLog(
                task_session_id=session_id,
                best_confidence=best_score,
                evidence_image_path=evidence_path
            ))

            await manager.broadcast({
                "event": "unrecognized_face_detected",
                "best_confidence": best_score
            }, session_id=session_id)

    await db.commit()

    response = {"recognized": recognized_list, "unrecognized": unrecognized_count}
    if draw_box:
        response["frame"] = draw_boxes_on_image(img.copy(), recognized_boxes, unrecognized_boxes)
    if crop_faces:
        response["crop_faces"] = crop_faces_from_image(img, all_crop_boxes)
    return response


def _save_evidence_image(face_crop, folder: str) -> str | None:
    """Lưu crop khuôn mặt xuống disk, trả về đường dẫn."""
    try:
        if face_crop is None or face_crop.size == 0:
            return None
        os.makedirs(folder, exist_ok=True)
        filename = f"{uuid.uuid4().hex}.jpg"
        path = os.path.join(folder, filename)
        cv2.imwrite(path, face_crop)
        return path
    except Exception:
        return None  # Không lưu được ảnh thì bỏ qua, không dừng luồng


# ─── Report ──────────────────────────────────────────────────────────────────

async def get_session_report(session_id: int, db: AsyncSession):
    stmt = select(TaskHumanSession).where(
        TaskHumanSession.task_session_id == session_id
    ).options(
        selectinload(TaskHumanSession.task_human).selectinload(TaskHuman.human),
        selectinload(TaskHumanSession.task_human_session_logs),
        selectinload(TaskHumanSession.attendance_audit_logs)
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()

    total = len(sessions)
    attended = sum(1 for s in sessions if s.attended)
    
    details = []
    for s in sessions:
        logs = s.task_human_session_logs
        audit_logs = s.attendance_audit_logs
        first_detected = min((log.created_at for log in logs), default=None)
        last_detected = max((log.created_at for log in logs), default=None)
        details.append({
            "task_human_session_id": s.id,
            "human_id": s.task_human.human.id,
            "name": s.task_human.human.name,
            "attended": s.attended,
            "first_detected": first_detected.isoformat() if first_detected else None,
            "last_detected": last_detected.isoformat() if last_detected else None,
            "detection_count": len(logs),
            "manually_edited": len(audit_logs) > 0,  # Có bị sửa tay không?
            "audit_logs": [
                {
                    "old_value": a.old_value,
                    "new_value": a.new_value,
                    "reason": a.reason,
                    "changed_at": a.changed_at.isoformat()
                } for a in sorted(audit_logs, key=lambda x: x.changed_at)
            ]
        })

    return {
        "session_id": session_id,
        "total": total,
        "attended": attended,
        "absent": total - attended,
        "attendance_rate": (attended / total * 100) if total > 0 else 0,
        "details": details
    }


async def get_task_report(task_id: int, db: AsyncSession):
    task = await db.execute(select(Task).where(Task.id == task_id))
    task = task.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    sessions_stmt = select(TaskSession).where(TaskSession.task_id == task_id)
    s_result = await db.execute(sessions_stmt)
    task_sessions = s_result.scalars().all()

    total_sessions = len(task_sessions)
    if total_sessions == 0:
        return {"task_id": task_id, "task_name": task.name, "total_sessions": 0, "overall_attendance_rate": 0}

    total_attendance_rates = 0
    for ts in task_sessions:
        ths_stmt = select(TaskHumanSession).where(TaskHumanSession.task_session_id == ts.id)
        ths_res = await db.execute(ths_stmt)
        ths_all = ths_res.scalars().all()
        t_count = len(ths_all)
        if t_count > 0:
            a_count = sum(1 for x in ths_all if x.attended)
            total_attendance_rates += (a_count / t_count)

    return {
        "task_id": task_id,
        "task_name": task.name,
        "total_sessions": total_sessions,
        "overall_attendance_rate": (total_attendance_rates / total_sessions * 100)
    }


async def get_task_sessions(task_id: int, db: AsyncSession):
    stmt = select(TaskSession).where(TaskSession.task_id == task_id).order_by(TaskSession.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def update_session_status(session_id: int, status: str, db: AsyncSession):
    if status not in ["PENDING", "ACTIVE", "CLOSED"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    stmt = select(TaskSession).where(TaskSession.id == session_id)
    result = await db.execute(stmt)
    task_session = result.scalars().first()
    
    if not task_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    task_session.status = status
    await db.commit()
    await db.refresh(task_session)
    return task_session


# ─── Manual override — GV sửa thủ công ─────────────────────────────────────

async def override_attendance(
    task_human_session_id: int,
    new_attended: bool,
    changed_by_user_id,
    reason: str,
    db: AsyncSession
):
    """GV sửa thủ công trạng thái điểm danh. Bắt buộc có lý do. Mọi thay đổi được audit log."""
    if not reason or not reason.strip():
        raise HTTPException(status_code=400, detail="Phải nhập lý do khi sửa thủ công")

    stmt = select(TaskHumanSession).where(TaskHumanSession.id == task_human_session_id).options(
        selectinload(TaskHumanSession.task_human).selectinload(TaskHuman.human)
    )
    result = await db.execute(stmt)
    ths = result.scalars().first()
    if not ths:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi điểm danh")

    old_value = ths.attended

    if old_value == new_attended:
        return {
            "message": "Không thay đổi (giá trị đã giống nhau)",
            "human_name": ths.task_human.human.name,
            "attended": ths.attended
        }

    # Ghi audit log trước khi thay đổi
    audit = AttendanceAuditLog(
        task_human_session_id=task_human_session_id,
        changed_by=changed_by_user_id,
        old_value=old_value,
        new_value=new_attended,
        reason=reason.strip()
    )
    db.add(audit)

    # Thực hiện thay đổi
    ths.attended = new_attended
    await db.commit()

    return {
        "message": f"Đã sửa: {'Có mặt' if old_value else 'Vắng'} → {'Có mặt' if new_attended else 'Vắng'}",
        "human_name": ths.task_human.human.name,
        "attended": new_attended,
        "reason": reason.strip()
    }
