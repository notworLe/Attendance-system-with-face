from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from datetime import datetime
import cv2
import numpy as np

from routers.task.model import Task, TaskHuman, TaskSession, TaskHumanSession, TaskHumanSessionLog
from routers.human.model import Human
from .schema import SessionCreate
from ai_service.recognition import detection_embedding, cosine_similarity, draw_boxes_on_image, crop_faces_from_image
from .websockets import manager

async def create_session(task_id: int, session_data: SessionCreate, user_id: int, session: AsyncSession):
    # Check if task exists and belongs to user
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

    # Copy TaskHuman to TaskHumanSession
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
    # Verify session is active
    stmt = select(TaskSession).where(TaskSession.id == session_id)
    result = await db.execute(stmt)
    task_session = result.scalars().first()
    
    if not task_session:
        raise HTTPException(status_code=404, detail="Session not found")
    if task_session.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Session is not ACTIVE")

    # Decode image
    nparray = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparray, cv2.IMREAD_COLOR)

    # AI Detection
    detected_faces = detection_embedding(img)
    if not detected_faces:
        return {"recognized": [], "unrecognized": 0}

    # Load session humans
    stmt = select(TaskHumanSession).where(
        TaskHumanSession.task_session_id == session_id
    ).options(selectinload(TaskHumanSession.task_human).selectinload(TaskHuman.human))
    
    ths_result = await db.execute(stmt)
    task_human_sessions = ths_result.scalars().all()

    if not task_human_sessions:
        raise HTTPException(status_code=400, detail="No humans in this session")

    # Prepare stored embeddings
    stored_embeddings = []
    ths_mapping = [] # to keep track of index
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
        best_score = similarities[best_match_idx]

        if best_score > task_session.threshold:
            matched_ths = ths_mapping[best_match_idx]
            # Create Log
            new_log = TaskHumanSessionLog(task_human_session_id=matched_ths.id)
            db.add(new_log)
            
            # Simple thresholding logic: if 1 match -> attended
            # Can be improved with required logs count if needed
            matched_ths.attended = True
            
            recognized_list.append({
                "human_id": matched_ths.task_human.human.id,
                "name": matched_ths.task_human.human.name,
                "confidence": float(best_score),
                "attended": True,
                "bbox": face.bbox.tolist()
            })
            recognized_boxes.append((face.bbox, best_score, matched_ths.task_human.human.name))
            
            # Notify dashboard
            await manager.broadcast({
                "event": "human_recognized",
                "human_id": matched_ths.task_human.human.id,
                "name": matched_ths.task_human.human.name,
                "confidence": float(best_score)
            }, session_id=session_id)
            
        else:
            unrecognized_count += 1
            unrecognized_boxes.append(face.bbox)
            # Notify unfamiliar face
            await manager.broadcast({
                "event": "unrecognized_face_detected"
            }, session_id=session_id)

    await db.commit()

    response = {
        "recognized": recognized_list,
        "unrecognized": unrecognized_count
    }

    if draw_box:
        response["frame"] = draw_boxes_on_image(img.copy(), recognized_boxes, unrecognized_boxes)
    if crop_faces:
        response["crop_faces"] = crop_faces_from_image(img, all_crop_boxes)

    return response

async def get_session_report(session_id: int, db: AsyncSession):
    stmt = select(TaskHumanSession).where(
        TaskHumanSession.task_session_id == session_id
    ).options(
        selectinload(TaskHumanSession.task_human).selectinload(TaskHuman.human),
        selectinload(TaskHumanSession.task_human_session_logs)
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()

    total = len(sessions)
    attended = sum(1 for s in sessions if s.attended)
    
    details = []
    for s in sessions:
        logs = s.task_human_session_logs
        first_detected = min((log.created_at for log in logs), default=None)
        last_detected = max((log.created_at for log in logs), default=None)
        details.append({
            "human_id": s.task_human.human.id,
            "name": s.task_human.human.name,
            "attended": s.attended,
            "first_detected": first_detected.isoformat() if first_detected else None,
            "last_detected": last_detected.isoformat() if last_detected else None,
            "detection_count": len(logs)
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
