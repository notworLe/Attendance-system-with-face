from fastapi import APIRouter, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from routers.user.router import current_active_user
from routers.user.db import User
from db.db import get_async_session
from . import crud
from .schema import HumanResponse, HumanCreate

router = APIRouter(prefix="/human", tags=["human"])

@router.post("/", response_model=HumanResponse)
async def create(human: HumanCreate,
            session: AsyncSession = Depends(get_async_session),
            user: User = Depends(current_active_user)
):
    human = await crud.create_human(session, human.name, human.embedding, user_id=user.id)
    return human

@router.get("/{human_id}", response_model=HumanResponse)
async def get(human_id: int,
              session: AsyncSession = Depends(get_async_session),
              user: User = Depends(current_active_user)):
    return await crud.get_human(session, human_id, user_id=user.id)

@router.get("/", response_model=list[HumanResponse])
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