from fastapi import FastAPI, Depends
from routers.task.router import router as task_router
from routers.human.router import router as human_router
from routers.session.router import router as session_router
from routers.human.model import Human
from routers.task.model import Task, TaskHuman, TaskHumanSessionLog

from contextlib import asynccontextmanager
from db.db import create_db_and_tables
from routers.user.router import auth_backend, current_active_user, fastapi_users
from routers.user.schema import UserUpdate, UserCreate, UserRead
from routers.user.db import User



@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(task_router)
app.include_router(human_router)
app.include_router(session_router)
app.include_router(
    fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)


@app.get("/authenticated-route")
async def authenticated_route(user: User = Depends(current_active_user)):
    return {"message": f"Hello {user.email}!"}
@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


