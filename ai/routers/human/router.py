from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from routers.user.router import current_active_user
from routers.user.db import User
from db.db import get_async_session
from . import crud
from .schema import HumanDisplay, HumanCreate
from ai_service.recognition import embedding_single_face
import cv2
import numpy as np
router = APIRouter(prefix="/human", tags=["human"])

# from loguru import logger
# logger.add('his_log.log')
@router.post("/", response_model=HumanDisplay)
async def create(human: str = Form(...),
             image: UploadFile = File(...),
            session: AsyncSession = Depends(get_async_session),
            user: User = Depends(current_active_user)
):
    bytes_image = await image.read()
    nparray = np.frombuffer(bytes_image, np.uint8)
    img = cv2.imdecode(nparray, cv2.IMREAD_COLOR)
    embedding = embedding_single_face(img)
    human = await crud.create_human(session, human, embedding, user_id=user.id)
    return human

@router.get("/{human_id}", response_model=HumanDisplay)
async def get(human_id: int,
              session: AsyncSession = Depends(get_async_session),
              user: User = Depends(current_active_user)):
    return await crud.get_human(human_id, user_id=user.id, session=session)

@router.get("/", response_model=list[HumanDisplay])
async def get_all(session: AsyncSession = Depends(get_async_session),
                  user: User = Depends(current_active_user)):
    return await crud.get_all_humans(session, user_id=user.id)

@router.delete("/{human_id}")
async def delete(human_id: int,
                 session: AsyncSession = Depends(get_async_session),
                 user: User = Depends(current_active_user)):
    success, message = await crud.delete_human(session, human_id, user_id=user.id)
    return {
        'success': success,
        'message': message
    }

@router.put('/{human_id}')
async def update(human_id: int,
                 human: HumanCreate,
                 user: User = Depends(current_active_user),
                 session: AsyncSession = Depends(get_async_session)):
    return await crud.update_human(session, human_id, user.id, human.model_dump())