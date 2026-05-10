# ======================= sqlalchemy setup ========================
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from collections.abc import AsyncGenerator
# ======================= sqlalchemy setup ========================

from sqlalchemy import text
from sqlalchemy.orm import DeclarativeBase
from fastapi import Depends

import os
from .db_objects import DatabaseConfiguration

DATABASE_URL = os.getenv("DATABASE_URL", DatabaseConfiguration(
    dialect='postgresql',
    driver='asyncpg',
    username='notworle',
    password='123456',
    host='localhost', # usually run locally
    port=5432,
    database='recognition_db'
).url())

from loguru import logger
logger.add('his_log.log')
logger.info(DATABASE_URL)

engine = create_async_engine(DATABASE_URL)

# expire_on_commit=False: after saving data, keep it readable in memory
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass



async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))  # thêm dòng này
        await conn.run_sync(Base.metadata.create_all)

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session


