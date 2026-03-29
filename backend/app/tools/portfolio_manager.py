import json
from pathlib import Path
from langchain_core.tools import tool

@tool
def get_personal_portfolio() -> str:
    """
    Instantly retrieves the user's highly confidential personal investment portfolio.
    Call this tool whenever you need to know exactly which stock tickers the user owns, 
    how many shares they hold, or their purchase prices to provide personalized recommendations.
    """
    try:
        base_dir = Path(__file__).parent.parent.parent
        portfolio_file = base_dir / "data" / "portfolio.json"
        
        if not portfolio_file.exists():
            return "The user's personal portfolio file is currently missing or empty."
            
        with open(portfolio_file, "r") as f:
            portfolio_data = json.load(f)
            
        if not portfolio_data:
            return "The user currently has no active holdings recorded."
            
        content = "USER CONFIDENTIAL HOLDINGS:\n"
        total_val = 0
        
        for holding in portfolio_data:
            ticker = holding.get('ticker')
            shares = float(holding.get('shares', 0))
            avg_price = float(holding.get('avg_price', 0))
            value = shares * avg_price
            total_val += value
            content += f"- TICKER: {ticker} | SHARES: {shares} | AVG PURCHASE PRICE: ${avg_price:,.2f} | CURRENT VALUE: ${value:,.2f}\n"
            
        content += f"\nTOTAL PORTFOLIO BOOK VALUE: ${total_val:,.2f}\n"
        return content
        
    except Exception as e:
        return f"Error reading portfolio data directly: {str(e)}"
