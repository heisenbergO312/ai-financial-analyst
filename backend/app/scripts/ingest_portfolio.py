import os
from pathlib import Path
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS

def ingest_user_portfolio(user_id: int, portfolio_data: list):
    """
    Ingests the user's personal investment records into an isolated FAISS AI memory namespace.
    `portfolio_data` should be a list of dicts: [{"ticker": "AAPL", "shares": 10, "avg_price": 150.0}, ...]
    """
    base_dir = Path(__file__).parent.parent.parent
    faiss_path = base_dir / "faiss_financial_db" / f"user_{user_id}"
    
    if not portfolio_data:
        return
        
    content = "CRITICAL USER HOLDINGS DATA (PERSONAL PORTFOLIO):\n\n"
    total_val = 0
    
    for holding in portfolio_data:
        # dicts can be accessed directly or with .get()
        ticker = holding.get('ticker')
        shares = float(holding.get('shares', 0))
        avg_price = float(holding.get('avg_price', 0))
        value = shares * avg_price
        total_val += value
        
        content += f"Ownership Record: The user currently owns {shares} shares of {ticker} at an average purchase price of ${avg_price:,.2f}. The current locked value is ${value:,.2f}.\n"
        
    content += f"\nTotal Original Portfolio Value: ${total_val:,.2f}\n"

    doc = Document(
        page_content=content, 
        metadata={"source": "user_personal_portfolio_v2", "user_id": user_id, "identity": "USER_INVESTMENT"}
    )
    
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    
    # We create a fresh new vector store for their specific namespace
    # OVERWRITE existing one to keep it perfectly synced with database
    vectorstore = FAISS.from_documents([doc], embedding=embeddings)
    vectorstore.save_local(str(faiss_path))
    
    print(f"User {user_id} portfolio seamlessly ingested into {faiss_path}.")
