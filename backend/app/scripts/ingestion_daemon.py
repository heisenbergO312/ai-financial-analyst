import os
import time
import json
import schedule
import requests
from pathlib import Path
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

# Load env variables
load_dotenv()
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")

# Extensive Universe of US and Indian Tickers
MASTER_TICKERS = [
    # US Mega-Cap & Tech Leaders
    "AAPL", "MSFT", "TSLA", "NVDA", "AMZN", "GOOGL", "META", "NFLX", "AMD", "INTC", 
    "JPM", "V", "JNJ", "WMT", "PG", "MA", "UNH", "HD", "BAC", "KO",
    
    # Indian Market Leaders (Alpha Vantage requires the .BSE suffix for Bombay Stock Exchange)
    "RELIANCE.BSE", "TCS.BSE", "HDFCBANK.BSE", "ICICIBANK.BSE", "INFY.BSE", 
    "SBIN.BSE", "HINDUNILVR.BSE", "ITC.BSE", "BHARTIARTL.BSE", "KOTAKBANK.BSE",
    "LT.BSE", "AXISBANK.BSE", "MARUTI.BSE", "SUNPHARMA.BSE", "BAJFINANCE.BSE"
]

BASE_DIR = Path(__file__).parent.parent.parent
TRACKING_FILE = BASE_DIR / "data" / "tracking.json"
FAISS_PATH = BASE_DIR / "faiss_financial_db"

# Free tier limits: 25 requests per day. 
# Since we hit exactly 2 endpoints (Overview and Earnings) per stock, we can process 12 stocks a day safely!
TICKERS_PER_DAY = 12

def fetch_alpha_vantage_data(ticker: str):
    """Fetches Overview and Earnings JSON seamlessly, translating them to standard RAG chunks."""
    documents = []
    print(f"  -> Fetching alpha api data for {ticker}...")
    
    # 1. Company Overview Network Request
    try:
        overview_url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}"
        overview_res = requests.get(overview_url).json()
        
        if "Symbol" in overview_res:
            content = f"Company Overview for {ticker}:\n"
            for key, value in overview_res.items():
                content += f"{key}: {value}\n"
            documents.append(Document(page_content=content, metadata={"source": f"AlphaVantage_Overview_{ticker}"}))
    except Exception as e:
        print(f"     Error fetching overview for {ticker}: {e}")

    # STAGGER: Alpha Vantage strictly enforces 5 requests per MINUTE!
    # By sleeping 15 seconds after each HTTP hit, we average exactly 4 requests a minute, safely flying under the radar.
    time.sleep(15) 
    
    # 2. Annual Earnings Network Request
    try:
        earnings_url = f"https://www.alphavantage.co/query?function=EARNINGS&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}"
        earnings_res = requests.get(earnings_url).json()
        
        if "symbol" in earnings_res and "annualEarnings" in earnings_res:
            content = f"Annual Earnings Data for {ticker}:\n"
            for earning in earnings_res["annualEarnings"][:5]: # Top 5 recent historical years
                content += f"Fiscal Year Ending {earning.get('fiscalDateEnding')}: Reported EPS of {earning.get('reportedEPS')}\n"
            documents.append(Document(page_content=content, metadata={"source": f"AlphaVantage_Earnings_{ticker}"}))
    except Exception as e:
        print(f"     Error fetching earnings for {ticker}: {e}")
        
    time.sleep(15) # Final buffer for the 5 request threshold
    return documents

def run_daily_ingestion_batch():
    """Executes a single daily batch of 12 un-tracked tickers, logs them, and cleanly merges into FAISS."""
    print("\n=======================================================")
    print("--- Starting Daily Alpha Vantage Ingestion Cronjob ---")
    
    # Parse tracking memory
    if TRACKING_FILE.exists():
        with open(TRACKING_FILE, "r") as f:
            state = json.load(f)
    else:
        state = {"completed": []}
        
    completed_tickers = set(state.get("completed", []))
    
    # Wrap-around logic
    if len(completed_tickers) >= len(MASTER_TICKERS):
        print("All tickers in the master universe have been updated! Resetting tracking logic to start fresh updates...")
        completed_tickers = set()
        
    # Queue the next batch of completely un-tracked tickers
    remaining_tickers = [t for t in MASTER_TICKERS if t not in completed_tickers]
    batch_tickers = remaining_tickers[:TICKERS_PER_DAY]
    
    print(f"Selected {len(batch_tickers)} fresh tickers for today's data scrape: {batch_tickers}")
    
    raw_docs = []
    successful_tickers = []
    
    for ticker in batch_tickers:
        docs = fetch_alpha_vantage_data(ticker)
        if docs:
            raw_docs.extend(docs)
            successful_tickers.append(ticker)
        else:
            print(f"  -> WARNING: No data retrieved for {ticker}. Check API limits. Automatically queuing for retry tomorrow.")

    if not raw_docs:
        print("No documents generated in this batch. Rate limit likely triggered globally. Aborting FAISS merging.")
        return
        
    print(f"\nChunking {len(raw_docs)} downloaded documents...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    splits = text_splitter.split_documents(raw_docs)

    print(f"Generating Fast AI Embeddings for {len(splits)} semantic chunks...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    print("Appending to Live Local FAISS AI Memory...")
    
    # ADVANCED MERGING: We don't overwrite FAISS, we append new vectors safely to the existing graph!
    if FAISS_PATH.exists() and (FAISS_PATH / "index.faiss").exists():
        new_vectorstore = FAISS.from_documents(documents=splits, embedding=embeddings)
        master_vectorstore = FAISS.load_local(str(FAISS_PATH), embeddings, allow_dangerous_deserialization=True)
        master_vectorstore.merge_from(new_vectorstore)
        master_vectorstore.save_local(str(FAISS_PATH))
        print("Successfully merged new ticker batch comprehensively into the existing FAISS database.")
    else:
        vectorstore = FAISS.from_documents(documents=splits, embedding=embeddings)
        vectorstore.save_local(str(FAISS_PATH))
        print("Created absolutely new FAISS database graph from scratch.")

    # Save tracking state natively
    completed_tickers.update(successful_tickers)
    state["completed"] = list(completed_tickers)
    
    os.makedirs(TRACKING_FILE.parent, exist_ok=True)
    with open(TRACKING_FILE, "w") as f:
        json.dump(state, f, indent=4)
        
    print(f"Batch complete. Total master progress: {len(state['completed'])} / {len(MASTER_TICKERS)}")
    print("Sleeping node until tomorrow's job.")
    print("=======================================================\n")

def start_daemon():
    print("Initializing Ingestion Daemon Thread...")
    
    # 1. Run it immediately once on startup
    run_daily_ingestion_batch()
    
    # 2. Schedule it to run exactly every morning at 6:00 AM automatically
    schedule.every().day.at("06:00").do(run_daily_ingestion_batch)
    
    print("\nDaemon is now running continuously. Safe to detach terminal.")
    while True:
        schedule.run_pending()
        time.sleep(3600)  # Check schedule every hour natively to maintain 0% CPU footprint

if __name__ == "__main__":
    start_daemon()
