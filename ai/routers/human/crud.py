from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from .model import Human
import numpy as np
from loguru import logger
logger.add('his_log.log')
import uuid

# CREATE
async def create_human(session: AsyncSession,
                       name: str,
                       embedding: list[float],
                       user_id) -> Human:
    human = Human(name=name,
                  embedding=embedding,
                  user_id=user_id
              )
    session.add(human)
    await session.commit()
    await session.refresh(human)
    return human


# READ ONE
async def get_human(human_id: int, user_id: uuid.UUID, session: AsyncSession) -> Human | None:
    result = await session.execute(select(Human).where(Human.id == human_id))
    human = result.scalar_one_or_none()
    if human is None:
        raise HTTPException(status_code=400, detail="Can't found human")
    else:
        if human.user_id != user_id:
            raise HTTPException(status_code=404, detail="Not authorization")
        return human


# READ ALL
async def get_all_humans(session: AsyncSession, user_id: uuid.UUID) -> list[Human]:
    result = await session.execute(select(Human).where(Human.user_id==user_id))
    return result.scalars().all()


# UPDATE
async def update_human(session: AsyncSession,
                       human_id: int,
                        user_id: uuid.UUID,
                       name: str = None,
                       embedding: list[float] = None,

                       ) -> Human | None:
    human = await get_human(session, human_id, user_id)

    if name:
        human.name = name
    if embedding:
        human.embedding = embedding
    await session.commit()
    await session.refresh(human)
    return human


# DELETE
async def delete_human(session: AsyncSession, human_id: int, user_id: uuid.UUID):
    human = await get_human(session, human_id, user_id)
    await session.delete(human)
    await session.commit()
    return True, 'Deleted human'


# SEARCH by embedding (vector similarity)
async def search_similar(session: AsyncSession, embedding: list[float], limit: int = 5) -> list[Human]:
    result = await session.execute(
        select(Human)
        .order_by(Human.embedding.cosine_distance(embedding))
        .limit(limit)
    )
    return result.scalars().all()