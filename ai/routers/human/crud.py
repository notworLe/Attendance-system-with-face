from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException
from .model import Human
from loguru import logger
logger.add('his_log.log')
import uuid
from .schema import HumanUpdate
import numpy as np
import cv2
from ai_service.recognition import embedding_single_face

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
async def update_human(
        human_id: int,
        user_id: uuid.UUID,
        session: AsyncSession,
        name: str = None,
        image=None,
                       ) -> Human | None:
    human = await get_human(human_id, user_id, session)

    if name is not None:
        human.name = name
    if image is not None:
        bytes_image = await image.read()
        nparray = np.frombuffer(bytes_image, np.uint8)
        img = cv2.imdecode(nparray, cv2.IMREAD_COLOR)
        embedding = embedding_single_face(img)
        human.embedding = embedding
    await session.commit()
    await session.refresh(human)
    return human


# DELETE
async def delete_human(session: AsyncSession, human_id: int, user_id: uuid.UUID):
    human = await get_human(human_id=human_id, user_id=user_id, session=session)
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