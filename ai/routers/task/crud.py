from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from .model import Task, TaskHuman
from .schema import TaskUpdate, TaskHumanCreate
from routers.human import crud as human_crud
import uuid

from loguru import logger
logger.add('his_log.log')

# SQL
async def task_read_sql(
        task_id: int,
        session: AsyncSession
):
    return await session.execute(
        select(Task)
        .where(Task.id == task_id)
    )



# CREATE
async def create_task(
                      name: str,
                      user_id,
                      session: AsyncSession):
    task = Task(
        name=name,
        user_id=user_id
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task

# READ all
async def read_all(
        user_id: uuid.UUID,
        session: AsyncSession
):
    result = await session.execute(select(Task).where(Task.user_id==user_id))
    return result.scalars().all()



# READ one
async def task_read(
        task_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
)-> Task:
    result = await task_read_sql(task_id, session)
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Can't found task")
    else:
        if task.user_id != user_id:
            raise HTTPException(status_code=401, detail="Not authorization")

        return task

# UPDATE one
async def update(
        task: TaskUpdate,
        task_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
):
    task_old = await task_read(task_id, user_id, session)
    task_old.name = task.name
    task_old.updated_at = datetime.now()
    await session.commit()
    await session.refresh(task_old)
    return task_old

# DELETE one
async def delete(
        task_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
):
    task = await task_read(task_id, user_id, session)
    await session.delete(task)
    await session.commit()
    return True, "Deleted task"

# TASK HUMAN
# Validation
async def is_human_exited_task(
        task_id: int,
        human_id: int,
        session: AsyncSession
)-> bool:
    existing = await session.execute(
        select(TaskHuman)
        .where(
            TaskHuman.task_id==task_id,
            TaskHuman.human_id==human_id
        )
    )
    if existing.scalar_one_or_none():
        return True
    return False


# CREATE one
async def add_human_to_task(
        task_id: int,
        human_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
):
    if await is_human_exited_task(task_id, human_id, session):
        raise HTTPException(status_code=400, detail="This human have added")
    else:
        task = await task_read(task_id, user_id, session)
        human = await human_crud.get_human(human_id, user_id, session)

        task_human = TaskHuman(
            task_id=task.id,
            human_id=human.id
        )
        session.add(task_human)
        await session.commit()
        await session.refresh(task_human)
        return task_human

# READ one
async def read_task_human(
        task_human_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
):
    result = await session.execute(
        select(TaskHuman).where(TaskHuman.id==task_human_id)
    )
    task_human = result.scalar_one_or_none()
    if task_human:
        return task_human, result
    else:
        raise HTTPException(status_code=404, detail="Can't found task human")

async def read_task_list_human(
        task_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
):
    # Validation
    await task_read(task_id, user_id, session)

    result = await session.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(
            selectinload(Task.task_humans)
            .selectinload(TaskHuman.human)
        )
    )
    task = result.scalar_one_or_none()
    # Debug xem task_humans có gì không
    logger.info(f"task_humans count: {len(task.task_humans)}")
    logger.info(f"task_humans: {task.task_humans}")
    return task

