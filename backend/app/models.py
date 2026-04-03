from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    portfolio = relationship("PortfolioItem", back_populates="owner")
    monthly_budgets = relationship("MonthlyBudget", back_populates="owner")

class PortfolioItem(Base):
    __tablename__ = "portfolio_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ticker = Column(String, index=True)
    shares = Column(Float)
    avg_price = Column(Float)

    owner = relationship("User", back_populates="portfolio")

class MonthlyBudget(Base):
    __tablename__ = "monthly_budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)          # 1-12
    category_totals = Column(JSON, nullable=False)   # {"Housing": 25000, ...}
    transactions = Column(JSON, nullable=True)       # [{date, description, amount, category}, ...]
    income = Column(Float, default=0.0)
    transaction_count = Column(Integer, default=0)

    owner = relationship("User", back_populates="monthly_budgets")

    __table_args__ = (
        UniqueConstraint("user_id", "year", "month", name="uq_user_year_month"),
    )
