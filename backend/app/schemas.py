from pydantic import BaseModel
from typing import List

class ChatRequest(BaseModel):
    """
    Schema for a user chat request.
    """
    message: str

class ChatResponse(BaseModel):
    """
    Schema for the financial analyst's response.
    """
    response: str
    history: List[dict] = []
