import os
import requests
from pathlib import Path
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

# We need an Alpha Vantage API key to fetch data.
# Add ALPHA_VANTAGE_API_KEY=your_key to your backend/.env file
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "demo")

def fetch_alpha_vantage_data(ticker: str):
    """
    Fetches comprehensive Company Overview and latest Earnings from the Alpha Vantage API
    and formats them as structured text for the LangChain Vector DB.
    """
    documents = []
    print(f"Fetching live Alpha Vantage API data for {ticker}...")
    
    # 1. Fetch Company Overview Attributes
    overview_url = f"https://www.alphavantage.co/query?function=OVERVIEW&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}"
    overview_res = requests.get(overview_url).json()
    
    if "Symbol" in overview_res:
        content = f"Company Overview for {ticker}:\n"
        for key, value in overview_res.items():
            content += f"{key}: {value}\n"
        documents.append(Document(page_content=content, metadata={"source": f"AlphaVantage_Overview_{ticker}"}))
    else:
        print(f"  -> Warning: Could not fetch overview for {ticker}. API rate limit or invalid symbol.")

    # 2. Fetch Annual Earnings Data
    earnings_url = f"https://www.alphavantage.co/query?function=EARNINGS&symbol={ticker}&apikey={ALPHA_VANTAGE_API_KEY}"
    earnings_res = requests.get(earnings_url).json()
    
    if "symbol" in earnings_res and "annualEarnings" in earnings_res:
        content = f"Annual Earnings Data for {ticker}:\n"
        for earning in earnings_res["annualEarnings"][:5]: # Top 5 recent records
            content += f"Fiscal Year Ending {earning.get('fiscalDateEnding')}: Reported EPS of {earning.get('reportedEPS')}\n"
        documents.append(Document(page_content=content, metadata={"source": f"AlphaVantage_Earnings_{ticker}"}))

    return documents

def ingest_financial_reports():
    """
    Ingests structured financial data directly from Alpha Vantage APIs,
    splits them, and saves embeddings logically entirely replacing PDFs!
    """
    base_dir = Path(__file__).parent.parent.parent
    
    # Define a default universe of stocks to ingest into the "Brain"
    tickers_to_track = ["AAPL", "MSFT", "TSLA", "NVDA"]
    
    raw_docs = []
    for ticker in tickers_to_track:
        docs = fetch_alpha_vantage_data(ticker)
        raw_docs.extend(docs)

    if not raw_docs:
        print("No data was fetched from Alpha Vantage. Ensure you have network connectivity and a valid API key.")
        return

    print(f"\nChunking {len(raw_docs)} Alpha Vantage API reports into precise semantic blocks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    splits = text_splitter.split_documents(raw_docs)

    print(f"Generating Embeddings for {len(splits)} semantic chunks...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    print("Saving Vector Database to FAISS locally...")
    faiss_path = base_dir / "faiss_financial_db"
    
    vectorstore = FAISS.from_documents(documents=splits, embedding=embeddings)
    vectorstore.save_local(str(faiss_path))
    
    print(f"Ingestion complete! FAISS database updated from LIVE API data at '{faiss_path}'.")

if __name__ == "__main__":
    ingest_financial_reports()
