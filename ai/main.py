from fastapi import FastAPI
from routers.task.router import router as task_router
from routers.human.router import router as human_router
from contextlib import asynccontextmanager
from db.db import create_db_and_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield


app = FastAPI()
app.include_router(task_router)
app.include_router(human_router)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


