import os
import json
from pathlib import Path
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

load_dotenv()

def ingest_portfolio():
    """
    Reads the user's personal investment records from portfolio.json, formats them into a perfect 
    semantic context string, and merges them directly into the FAISS AI memory alongside the Global stocks!
    """
    base_dir = Path(__file__).parent.parent.parent
    portfolio_file = base_dir / "data" / "portfolio.json"
    faiss_path = base_dir / "faiss_financial_db"
    
    if not portfolio_file.exists():
        print(f"Portfolio file not found at {portfolio_file}. Please create it first.")
        return

    print("Loading your personal portfolio JSON...")
    with open(portfolio_file, "r") as f:
        portfolio_data = json.load(f)

    # 1. We format the raw JSON into specific, highly-readable semantic text for Gemini
    content = "CRITICAL USER HOLDINGS DATA (PERSONAL PORTFOLIO):\n\n"
    total_val = 0
    
    for holding in portfolio_data:
        ticker = holding.get('ticker')
        shares = float(holding.get('shares', 0))
        avg_price = float(holding.get('avg_price', 0))
        value = shares * avg_price
        total_val += value
        
        content += f"Ownership Record: The user currently owns {shares} shares of {ticker} at an average purchase price of ${avg_price:,.2f}. The current locked value is ${value:,.2f}.\n"
        
    content += f"\nTotal Original Portfolio Value: ${total_val:,.2f}\n"
        
    # 2. Package into a LangChain Document with explicit metadata tracking
    doc = Document(
        page_content=content, 
        metadata={"source": "user_personal_portfolio_v1", "identity": "USER_INVESTMENT"}
    )
    
    print("Generating mathematical embeddings for your exact portfolio structure...")
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    # 3. Safely MERGE it into the existing FAISS database
    # This places the user's private data right next to Alpha Vantage's global data geometrically.
    if faiss_path.exists() and (faiss_path / "index.faiss").exists():
        new_vectorstore = FAISS.from_documents([doc], embedding=embeddings)
        master = FAISS.load_local(str(faiss_path), embeddings, allow_dangerous_deserialization=True)
        master.merge_from(new_vectorstore)
        master.save_local(str(faiss_path))
        print("\nSUCCESS! Your highly-confidential portfolio is now permanently merged into the global FAISS memory.")
        print("To query it, just ask the React Dashboard: 'Analyze my current portfolio.'")
    else:
        print("\nERROR: FAISS master database not found. Please run the ingest_docs.py global script first to build the base FAISS graph.")

if __name__ == "__main__":
    ingest_portfolio()
