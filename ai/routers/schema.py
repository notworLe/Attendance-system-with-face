from pydantic import BaseModel

class RequestResponse(BaseModel):
    success: bool
    message: str