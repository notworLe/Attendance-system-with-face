from fastapi import APIRouter, Depends, File, UploadFile, Query, WebSocket, WebSocketDisconnect, Body
from sqlalchemy.ext.asyncio import AsyncSession
from db.db import get_async_session
from routers.user.router import current_active_user
from routers.user.db import User
from . import crud, schema
from .websockets import manager

router = APIRouter(tags=["Session"])


@router.post("/task/{task_id}/session", response_model=schema.SessionResponse)
async def create_session(
    task_id: int,
    session_data: schema.SessionCreate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session)
):
    return await crud.create_session(task_id, session_data, user.id, db)


@router.put("/session/{session_id}/close")
async def close_session(
    session_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session)
):
    return await crud.close_session(session_id, db)


@router.patch("/session/{session_id}/status", response_model=schema.SessionResponse)
async def update_session_status(
    session_id: int,
    status_data: schema.SessionStatusUpdate,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session)
):
    return await crud.update_session_status(session_id, status_data.status, db)


@router.get("/task/{task_id}/sessions", response_model=list[schema.SessionResponse])
async def get_task_sessions(
    task_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session)
):
    return await crud.get_task_sessions(task_id, db)


@router.post("/session/{session_id}/recognize", response_model=schema.RecognizeResponse)
async def recognize_faces(
    session_id: int,
    image: UploadFile = File(...),
    draw_box: bool = Query(False),
    crop_faces: bool = Query(False),
    db: AsyncSession = Depends(get_async_session)
):
    # No auth required — IoT/edge device friendly
    image_bytes = await image.read()
    return await crud.recognize_faces(session_id, image_bytes, draw_box, crop_faces, db)


@router.get("/session/{session_id}/report", response_model=schema.SessionReportResponse)
async def get_session_report(
    session_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session)
):
    return await crud.get_session_report(session_id, db)


@router.get("/task/{task_id}/report", response_model=schema.TaskReportResponse)
async def get_task_report(
    task_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session)
):
    return await crud.get_task_report(task_id, db)


# ─── Sửa thủ công điểm danh ─────────────────────────────────────────────────

@router.patch("/session/{session_id}/attendance/{task_human_session_id}")
async def override_attendance(
    session_id: int,
    task_human_session_id: int,
    attended: bool = Body(..., embed=True),
    reason: str = Body(..., embed=True),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_async_session)
):
    """
    GV sửa thủ công trạng thái điểm danh (có mặt ↔ vắng).
    - Bắt buộc nhập lý do (reason)
    - Ghi audit log: ai sửa, lúc nào, cũ → mới, lý do
    """
    return await crud.override_attendance(task_human_session_id, attended, user.id, reason, db)


@router.websocket("/ws/session/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: int):
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
