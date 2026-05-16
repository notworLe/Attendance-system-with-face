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

# CREATE one
@router.post('', response_model=TaskResponse)
async def create(
        task: TaskCreate,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.task_create(
        user=user,
        name=task.name,
        teacher_id=task.teacher_id,
        start_date=task.start_date,
        shift=task.shift,
        num_sessions=task.num_sessions,
        session=session
    )

@router.get('', response_model=list[TaskResponse])
async def get_all_tasks(
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.task_read_all(user=user, session=session)

@router.get('/{task_id}', response_model=TaskResponse)
async def get(
        task_id: int,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.task_read(task_id=task_id, user=user, session=session)




@router.put('/{task_id}', response_model=TaskResponse)
async def update(
        task_id: int,
        task: TaskUpdate,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.task_update(task_id=task_id, user=user, task=task, session=session)

@router.delete('/{task_id}')
async def delete(
        task_id: int,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    success, message = await crud.task_delete(task_id=task_id, user=user, session=session)
    return {
        'success': success,
        'message': message
    }

@router.get('/{task_id}/humans', response_model=TaskDisplay)
async def get_all_humans(
        task_id: int,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.read_task_list_human(task_id, user, session)

@router.post('/{task_id}/humans')
async def add_human_to_task(
        task_id: int,
        human_id: int,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    message = await crud.add_human_to_task(task_id, human_id, user, session)
    return {
        'message': message
    }



@router.delete('/{task_id}/humans/{human_id}')
async def remove_human_from_task(
        task_id: int,
        human_id: int,
        user: User = Depends(current_active_user),
        session: AsyncSession = Depends(get_async_session)
):
    return await crud.remove_human_from_task(task_id, human_id, user, session)


# @router.post('/{task_id}/humans/{human_id}/attendance')
# async def found_human(
#         task_id: int,
#         human_id: int,
#         session: AsyncSession = Depends(get_async_session)
# ):
#     pass


# CREATE one
