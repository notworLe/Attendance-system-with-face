from fastapi import APIRouter
from .schema import (TaskCreate,
                     TaskResponse,
                     TaskUpdate,
                     TaskHumanCreate,
                     TaskDisplay)
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from db.db import get_async_session
from routers.task import crud
from routers.user.db import User
from routers.user.router import current_active_user
router = APIRouter(
    prefix='/task',
    tags=['Task']
)

@router.get('', response_model=list[TaskResponse])
async def get_all_tasks(
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.read_all(user_id=user.id, session=session)

@router.get('/{task_id}', response_model=TaskResponse)
async def get(
        task_id: int,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.task_read(task_id=task_id, user_id=user.id, session=session)

@router.post('', response_model=TaskResponse)
async def create(
        task: TaskCreate,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.create_task(user_id=user.id, name=task.name, session=session)


@router.put('/{task_id}', response_model=TaskResponse)
async def update(
        task_id: int,
        task: TaskUpdate,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.update(task_id=task_id, user_id=user.id, task=task, session=session)

@router.delete('/{task_id}')
async def delete(
        task_id: int,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    success, message = await crud.delete(task_id=task_id, user_id=user.id, session=session)
    return {
        'success': success,
        'message': message
    }



# Task Human
@router.post('/add_human', response_model=TaskHumanCreate)
async def add_human_to_task(
        task_id: int,
        human_id: int,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.add_human_to_task(task_id, human_id, user.id, session)

@router.get('/{task_id}/list_human', response_model=TaskDisplay)
async def list_human(
        task_id: int,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    task = await crud.read_task_list_human(task_id, user.id, session)
    return {
        "id": task.id,
        "name": task.name,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "humans": [th.human for th in task.task_humans]
    }