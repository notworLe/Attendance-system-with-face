import asyncio
from db.db import async_session_maker
from routers.user.db import User
from routers.task.model import Task
from routers.human.model import Human
from fastapi_users.password import PasswordHelper

async def main():
    async with async_session_maker() as session:
        ph = PasswordHelper()
        admin = User(
            email="admin@example.com",
            hashed_password=ph.hash("admin123"),
            is_active=True,
            is_superuser=True,
            is_verified=True
        )
        t1 = User(
            email="teacher1@example.com",
            hashed_password=ph.hash("teacher123"),
            is_active=True,
            is_superuser=False,
            is_verified=True
        )
        t2 = User(
            email="teacher2@example.com",
            hashed_password=ph.hash("teacher123"),
            is_active=True,
            is_superuser=False,
            is_verified=True
        )
        session.add(admin)
        session.add(t1)
        session.add(t2)
        await session.commit()
        print("Users created successfully")

asyncio.run(main())
