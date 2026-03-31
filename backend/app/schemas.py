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

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    username: str
    password: str

class PortfolioItemBase(BaseModel):
    ticker: str
    shares: float
    avg_price: float

class PortfolioItemCreate(PortfolioItemBase):
    pass

class PortfolioItemResponse(PortfolioItemBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    username: str
    portfolio: List[PortfolioItemResponse] = []

    class Config:
        from_attributes = True

class MonthlyBudgetResponse(BaseModel):
    id: int
    year: int
    month: int
    category_totals: dict
    transactions: List[dict] = []
    transaction_count: int

    class Config:
        from_attributes = True

class MonthSummary(BaseModel):
    year: int
    month: int
    transaction_count: int
