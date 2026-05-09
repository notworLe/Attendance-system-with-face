from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from .model import Task, TaskHuman
from .schema import TaskUpdate, TaskHumanCreate
from routers.human import crud as human_crud
from routers.human.model import Human
import uuid

from loguru import logger
logger.add('his_log.log')

# SQL


# CREATE
async def task_create(
          name: str,
          user_id,
          session: AsyncSession
):
    task = Task(
        name=name,
        user_id=user_id
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task

# READ all
async def task_read_all(
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
    result = await session.execute(
        select(Task)
        .where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=404, detail="Can't found task")
    else:
        if task.user_id != user_id:
            raise HTTPException(status_code=401, detail="Not authorization")

        return task

# UPDATE one
async def task_update(
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
async def task_delete(
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
async def is_human_in_task(
        task_id: int,
        human_id: int,
        session: AsyncSession
)-> bool:
    """
    Check human in task
    :param task_id:
    :param human_id:
    :param session:
    :return:
    """
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

async def task_human_validation(
        task_id: int,
        human_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
)-> tuple[Task, Human]:
    """
    Validation owner of task and human
    :param task_id:
    :param human_id:
    :param user_id:
    :param session:
    :return:
    """
    task = await task_read(task_id, user_id, session)
    human = await human_crud.get_human(human_id, user_id, session)
    return task, human


# READ one
async def task_human_read(
        task_id: int,
        human_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
):
    await task_human_validation(task_id, human_id, user_id, session)

    result = await session.execute(
        select(TaskHuman)
        .where(TaskHuman.task_id==task_id)
        .where(TaskHuman.human_id==human_id)
    )
    task_human = result.scalar_one_or_none()
    if task_human:
        return task_human
    else:
        raise HTTPException(status_code=404, detail="Can't found task human")


# CREATE one
async def add_human_to_task(
        task_id: int,
        human_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
):
    if await is_human_in_task(task_id, human_id, session):
        raise HTTPException(status_code=400, detail="This human have added")
    else:
        task, human = await task_human_validation(task_id, human_id, user_id, session)

        task_human = TaskHuman(
            task_id=task.id,
            human_id=human.id
        )
        session.add(task_human)
        await session.commit()
        await session.refresh(task_human)
        return "Human has been added"


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

async def remove_human_from_task(
        task_id: int,
        human_id: int,
        user_id: uuid.UUID,
        session: AsyncSession
):
    task_human = await task_human_read(task_id, human_id, user_id, session)
    await session.delete(task_human)
    await session.commit()
    return True, "TaskHuman deleted"




