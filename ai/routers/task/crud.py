from datetime import datetime

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from .model import Task, TaskHuman
from .schema import TaskUpdate, TaskHumanCreate
from routers.human.model import Human
from .model import Task, TaskHuman, TaskSession, TaskHumanSession
from .schema import TaskUpdate, TaskHumanCreate
import uuid
from datetime import timedelta
from routers.human import crud as human_crud

from loguru import logger
logger.add('his_log.log')

# SQL


# CREATE
SHIFT_TIMES = {
    1: (6, 45, 9, 15),
    2: (9, 25, 11, 55),
    3: (12, 10, 14, 40),
    4: (14, 50, 17, 20),
    5: (17, 30, 20, 0),
}

async def task_create(
          name: str,
          user,
          session: AsyncSession,
          teacher_id = None,
          start_date = None,
          shift = None,
          num_sessions = None
):
    task = Task(
        name=name,
        user_id=user.id,
        teacher_id=teacher_id
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)

    if start_date and shift and num_sessions and shift in SHIFT_TIMES:
        if start_date.tzinfo is not None:
            start_date = start_date.replace(tzinfo=None)
        
        sh, sm, eh, em = SHIFT_TIMES[shift]
        for i in range(num_sessions):
            d = start_date + timedelta(days=7*i)
            start_dt = d.replace(hour=sh, minute=sm, second=0, microsecond=0)
            end_dt = d.replace(hour=eh, minute=em, second=0, microsecond=0)
            
            ts = TaskSession(
                task_id=task.id,
                start=start_dt,
                end=end_dt,
                threshold=0.5,
                status="PENDING",
                note=f"Buổi {i+1} (Ca {shift})"
            )
            session.add(ts)
        await session.commit()

    return task

# READ all
async def task_read_all(
        user,
        session: AsyncSession
):
    if user.is_superuser:
        result = await session.execute(select(Task))
    else:
        result = await session.execute(select(Task).where(Task.teacher_id==user.id))
    return result.scalars().all()



# READ one
async def task_read(
        task_id: int,
        user,
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
        if not user.is_superuser and task.teacher_id != user.id:
            raise HTTPException(status_code=401, detail="Not authorization")

        return task

# UPDATE one
async def task_update(
        task: TaskUpdate,
        task_id: int,
        user,
        session: AsyncSession
):
    task_old = await task_read(task_id, user, session)
    task_old.name = task.name
    if task.teacher_id is not None:
        task_old.teacher_id = task.teacher_id
    task_old.updated_at = datetime.now()
    await session.commit()
    await session.refresh(task_old)
    return task_old

# DELETE one
async def task_delete(
        task_id: int,
        user,
        session: AsyncSession
):
    task = await task_read(task_id, user, session)
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
        user,
        session: AsyncSession
)-> tuple[Task, Human]:
    """
    Validation owner of task and human
    :param task_id:
    :param human_id:
    :param user:
    :param session:
    :return:
    """
    task = await task_read(task_id, user, session)
    # Human doesn't have teacher_id yet, but keep user.id for human read if needed.
    # human_crud.get_human probably checks user_id == human.user_id. Wait, admin can add any human?
    # Actually if user is admin, they should bypass human ownership check too.
    # We will pass user to get_human and handle it there, but for now just pass user.id.
    human = await human_crud.get_human(human_id, user.id, session)
    return task, human


# READ one
async def task_human_read(
        task_id: int,
        human_id: int,
        user,
        session: AsyncSession
):
    await task_human_validation(task_id, human_id, user, session)

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
        user,
        session: AsyncSession
):
    if await is_human_in_task(task_id, human_id, session):
        raise HTTPException(status_code=400, detail="This human have added")
    else:
        task, human = await task_human_validation(task_id, human_id, user, session)

        task_human = TaskHuman(
            task_id=task.id,
            human_id=human.id
        )
        session.add(task_human)
        await session.commit()
        await session.refresh(task_human)

        # Populate TaskHumanSession for existing TaskSessions
        result = await session.execute(select(TaskSession).where(TaskSession.task_id == task_id))
        sessions = result.scalars().all()
        for ts in sessions:
            ths = TaskHumanSession(
                task_session_id=ts.id,
                task_human_id=task_human.id,
                attended=False
            )
            session.add(ths)
        await session.commit()

        return "Human has been added"


async def read_task_list_human(
        task_id: int,
        user,
        session: AsyncSession
):
    # Validation
    await task_read(task_id, user, session)

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
        user,
        session: AsyncSession
):
    task_human = await task_human_read(task_id, human_id, user, session)
    await session.delete(task_human)
    await session.commit()
    return True, "TaskHuman deleted"




