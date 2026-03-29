import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

def get_llm() -> ChatGoogleGenerativeAI:
    """
    Initializes and returns the ChatGoogleGenerativeAI instance.
    Uses the gemini-1.5-pro model. Requires GEMINI_API_KEY to be set in the environment.
    """
    if not os.environ.get("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY environment variable not set")
        
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.0,  # Zero temperature for analytical tasks
        max_retries=2
    )
