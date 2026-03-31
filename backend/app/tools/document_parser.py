import os
from pathlib import Path
from langchain_core.tools import tool
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.utilities import WikipediaAPIWrapper
from langchain_core.runnables.config import RunnableConfig

@tool
def parse_financial_document(query: str, config: RunnableConfig) -> str:
    """
    Searches the FAISS Vector Database to retrieve highly relevant context.
    The database contains both Global Stock Overviews AND the User's Personal Portfolio Holdings.
    If the database is missing or empty, it falls back instantly to Wikipedia.
    """
    try:
        user_id = config.get("configurable", {}).get("user_id")
        
        base_dir = Path(__file__).parent.parent.parent
        
        vectorstore = None
        embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
        
        # Load global context if exists (root faiss folder)
        global_faiss = base_dir / "faiss_financial_db" / "index.faiss"
        if global_faiss.exists():
            vectorstore = FAISS.load_local(
                str(base_dir / "faiss_financial_db"), 
                embeddings, 
                allow_dangerous_deserialization=True
            )
            
        # Merge user context if exists
        user_faiss = base_dir / "faiss_financial_db" / f"user_{user_id}" / "index.faiss"
        if user_id and user_faiss.exists():
            user_vs = FAISS.load_local(
                str(user_faiss.parent), 
                embeddings, 
                allow_dangerous_deserialization=True
            )
            if vectorstore:
                # FAISS merges geometrically in memory for this session
                vectorstore.merge_from(user_vs)
            else:
                vectorstore = user_vs
                
        # 1. Try local FAISS databases 
        if vectorstore:
            relevant_docs = vectorstore.similarity_search(query, k=3)
            if relevant_docs:
                context = "\n\n---\n\n".join([doc.page_content for doc in relevant_docs])
                return f"[Local Financial Document Context]:\n{context}"
                
        # 2. Fallback to Wikipedia
        wiki = WikipediaAPIWrapper(top_k_results=2, doc_content_chars_max=1500)
        wiki_res = wiki.run(query)
        if wiki_res:
             return f"[Wikipedia Fallback Context]:\n{wiki_res}"
             
        return "No relevant information found in local documents or fallback sources."
        
    except Exception as e:
        return f"Error retrieving document data: {str(e)}"
