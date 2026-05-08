from db.db import Base, get_async_session
from fastapi_users.db import SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import relationship

class User(SQLAlchemyBaseUserTableUUID, Base):
    humans = relationship('Human', back_populates='user')
    tasks = relationship('Task', back_populates='user')

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)