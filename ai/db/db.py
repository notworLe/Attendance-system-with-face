# ======================= sqlalchemy setup ========================
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
from collections.abc import AsyncGenerator
# ======================= sqlalchemy setup ========================

from loguru import logger
import os
from dotenv import load_dotenv
from sympy.physics.units import years

load_dotenv()
from .db_objects import DatabaseConfiguration


# DATABASE_URL = f'postgresql+psycopg2://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@localhost:'

DATABASE_URL = DatabaseConfiguration(
    dialect='postgresql',
    driver='asyncpg',
    username=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD'),
    host='localhost',
    port=5432,
    database=os.getenv('POSTGRES_DB')
).url()
logger.info(DATABASE_URL)

engine = create_async_engine(DATABASE_URL)

# expire_on_commit=False: after saving data, keep it readable in memory
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


# Make base class
class Base(DeclarativeBase):
    pass

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session
