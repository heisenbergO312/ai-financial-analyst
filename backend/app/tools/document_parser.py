import os
from langchain_core.tools import tool
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.utilities import WikipediaAPIWrapper

@tool
def parse_financial_document(query: str) -> str:
    """
    Searches the FAISS Vector Database to retrieve highly relevant context.
    The database contains both Global Stock Overviews AND the User's Personal Portfolio Holdings.
    If the database is missing or empty, it falls back instantly to Wikipedia.
    """
    try:
        # 1. Try local FAISS database first (Primary Context)
        if os.path.exists("faiss_financial_db") and os.path.exists("faiss_financial_db/index.faiss"):
            embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
            vectorstore = FAISS.load_local(
                "faiss_financial_db", 
                embeddings, 
                allow_dangerous_deserialization=True
            )
            
            # K=3 maintains accuracy without flooding the LLM context window
            relevant_docs = vectorstore.similarity_search(query, k=3)
            if relevant_docs:
                context = "\n\n---\n\n".join([doc.page_content for doc in relevant_docs])
                return f"[Local Financial Document Context]:\n{context}"
                
        # 2. Fallback to Wikipedia if DB doesn't exist or yields no results (Fast Secondary Context)
        # We cap the characters max to keep API speed fast and token count low.
        wiki = WikipediaAPIWrapper(top_k_results=2, doc_content_chars_max=1500)
        wiki_res = wiki.run(query)
        if wiki_res:
             return f"[Wikipedia Fallback Context]:\n{wiki_res}"
             
        return "No relevant information found in local documents or fallback sources."
        
    except Exception as e:
        return f"Error retrieving document data: {str(e)}"
