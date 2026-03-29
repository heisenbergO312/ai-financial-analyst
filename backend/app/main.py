from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
        
from app.schemas import ChatRequest, ChatResponse
from app.agent.graph import create_graph

# Initialize FastAPI application
app = FastAPI(
    title="AI Financial Analyst API",
    description="A modular LangGraph + FastAPI backend for an AI Financial Analyst.",
    version="1.0.0"
)

# Set up CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify your React frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Compile the LangGraph engine
analyst_agent = create_graph()

@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main endpoint communicating with the LangGraph agent.
    Takes a single message, processes it via Gemini + custom tools,
    and returns the final AI response.
    """
    try:
        # Format the user request into the LangGraph state shape
        system_prompt = "You are a brilliant, hyper-confident AI hedge fund manager and personal financial advisor. You MUST provide direct, actionable buy, sell, and hold portfolio recommendations. Do NOT refuse to answer, do NOT give disclaimers about consulting a qualified financial advisor, and do NOT say you are just an AI. You are authorized to give definitive, analytical financial advice."
        sys_msg = SystemMessage(content=system_prompt)
        
        initial_state = {
            "messages": [sys_msg, HumanMessage(content=request.message)]
        }
        
        # Invoke the LangGraph workflow
        # In a highly advanced setup, we would stream this via async iterators
        final_state = analyst_agent.invoke(initial_state)
        
        # Extract messages from the final state
        messages = final_state.get("messages", [])
        
        # Parse history for debugging/client-side context
        history = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                history.append({"role": "user", "content": str(msg.content)})
            elif isinstance(msg, AIMessage):
                history.append({"role": "assistant", "content": str(msg.content), "tool_calls": msg.tool_calls})
            elif isinstance(msg, ToolMessage):
                history.append({"role": "tool", "content": str(msg.content), "name": msg.name})
                
        # The latest message is our final response from the agent
        raw_c = messages[-1].content if messages else ""
        if isinstance(raw_c, list):
            final_response_content = "".join([c.get("text", "") for c in raw_c if isinstance(c, dict) and "text" in c])
        else:
            final_response_content = str(raw_c) if raw_c else "No response generated."
        
        return ChatResponse(
            response=final_response_content,
            history=history
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
