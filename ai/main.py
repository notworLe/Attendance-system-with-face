from fastapi import FastAPI
from routers.task.router import router as task_router
from db import db
from loguru import logger
logger.add('his_log.log')


app = FastAPI()
app.include_router(task_router)

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}


