import json
from pathlib import Path
from langchain_core.tools import tool
from langchain_core.runnables.config import RunnableConfig

from app.database import SessionLocal
from app.models import PortfolioItem

@tool
def get_personal_portfolio(config: RunnableConfig) -> str:
    """
    Instantly retrieves the user's highly confidential personal investment portfolio.
    Call this tool whenever you need to know exactly which stock tickers the user owns, 
    how many shares they hold, or their purchase prices to provide personalized recommendations.
    """
    try:
        user_id = config.get("configurable", {}).get("user_id")
        if not user_id:
            return "Error: Could not identify the authenticated user to fetch the portfolio."
            
        with SessionLocal() as db:
            portfolio_items = db.query(PortfolioItem).filter(PortfolioItem.user_id == user_id).all()
            
        if not portfolio_items:
            return "The user currently has no active holdings recorded."
            
        content = "USER CONFIDENTIAL HOLDINGS:\n"
        total_val = 0
        
        for holding in portfolio_items:
            ticker = holding.ticker
            shares = float(holding.shares)
            avg_price = float(holding.avg_price)
            value = shares * avg_price
            total_val += value
            content += f"- TICKER: {ticker} | SHARES: {shares} | AVG PURCHASE PRICE: ${avg_price:,.2f} | CURRENT VALUE: ${value:,.2f}\n"
            
        content += f"\nTOTAL PORTFOLIO BOOK VALUE: ${total_val:,.2f}\n"
        return content
        
    except Exception as e:
        return f"Error reading portfolio data directly: {str(e)}"
