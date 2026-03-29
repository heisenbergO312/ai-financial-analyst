from langchain_core.tools import tool
import yfinance as yf

@tool
def get_live_stock_price(ticker: str) -> str:
    """
    Fetches the current real-time stock price and daily performance for a given ticker symbol.
    Example tickers: 'AAPL' for Apple, 'RELIANCE.NS' for Indian stocks, 'BTC-USD' for Bitcoin.
    """
    try:
        stock = yf.Ticker(ticker)
        # Fast history fetch for the last day
        hist = stock.history(period="1d")
        
        if hist.empty:
            return f"Error: Could not find real-time data for ticker '{ticker}'."
            
        current_price = round(hist['Close'].iloc[-1], 2)
        return f"The current real-time price for {ticker} is {current_price}."
        
    except Exception as e:
        return f"Failed to fetch market data: {str(e)}"
