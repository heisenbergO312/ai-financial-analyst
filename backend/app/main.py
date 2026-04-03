from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langchain_core.runnables.config import RunnableConfig

from app.schemas import (
    ChatRequest, ChatResponse, UserCreate, UserResponse, Token, 
    PortfolioItemCreate, PortfolioItemResponse,
    MonthlyBudgetResponse, MonthSummary
)
from app.agent.graph import create_graph
from app import models, auth, database
from app.scripts.ingest_portfolio import ingest_user_portfolio
from app.tools.budget_parser import parse_bank_statement

# Create tables
models.Base.metadata.create_all(bind=database.engine)

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

@app.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/portfolio", response_model=List[PortfolioItemResponse])
def update_portfolio(items: List[PortfolioItemCreate], db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Clear old portfolio for exact syncing
    db.query(models.PortfolioItem).filter(models.PortfolioItem.user_id == current_user.id).delete()
    
    new_items = []
    for item in items:
        db_item = models.PortfolioItem(**item.model_dump(), user_id=current_user.id)
        db.add(db_item)
        new_items.append(db_item)
    db.commit()
    
    # Generate exact math format and ingest into FAISS vector database
    portfolio_data = [{"ticker": item.ticker, "shares": item.shares, "avg_price": item.avg_price} for item in items]
    ingest_user_portfolio(current_user.id, portfolio_data)
    
    # Ensure fresh read back
    portfolio = db.query(models.PortfolioItem).filter(models.PortfolioItem.user_id == current_user.id).all()
    return portfolio

@app.get("/portfolio", response_model=List[PortfolioItemResponse])
def get_portfolio(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    return current_user.portfolio

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, current_user: models.User = Depends(auth.get_current_user)):
    """
    Main endpoint communicating with the LangGraph agent.
    Takes a single message, processes it via Gemini + custom tools,
    and returns the final AI response.
    """
    try:
        system_prompt = """
        You are a brilliant, hyper-confident AI hedge fund manager and personal financial advisor. 
        You MUST provide direct, actionable buy, sell, and hold portfolio recommendations, and detailed EMI/Loan advisory.
        
        When advising on Loans/EMIs:
        1. Compare EMIs against the user's documented monthly income.
        2. Suggest specific prepayment amounts to reduce total interest.
        3. Identify if refinancing is beneficial based on current interest rates.
        
        Do NOT refuse to answer, do NOT give disclaimers about consulting a qualified financial advisor, and do NOT say you are just an AI. 
        You are authorized to give definitive, analytical financial advice.
        """
        sys_msg = SystemMessage(content=system_prompt)
        
        initial_state = {
            "messages": [sys_msg, HumanMessage(content=request.message)]
        }
        
        # LangGraph dynamic contextual execution via configurable runtime kwargs
        config = {"configurable": {"user_id": current_user.id}}
        final_state = analyst_agent.invoke(initial_state, config=config)
        
        messages = final_state.get("messages", [])
        
        history = []
        for msg in messages:
            if isinstance(msg, HumanMessage):
                history.append({"role": "user", "content": str(msg.content)})
            elif isinstance(msg, AIMessage):
                history.append({"role": "assistant", "content": str(msg.content), "tool_calls": msg.tool_calls})
            elif isinstance(msg, ToolMessage):
                history.append({"role": "tool", "content": str(msg.content), "name": msg.name})
                
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


@app.post("/upload-statement")
async def upload_bank_statement(
    file: UploadFile = File(...),
    year: int = 0,
    month: int = 0,
    password: str = Form(None),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Upload and parse a monthly bank statement PDF.
    - Decrypts using 'password' if necessary.
    - Stores categorized totals in the DB keyed by (user, year, month).
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    if year == 0 or month == 0 or not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="Valid year and month (1-12) are required.")
    
    try:
        pdf_bytes = await file.read()
        result = parse_bank_statement(pdf_bytes, password=password)

        # Validation: Check if the statement month and year match what the user selected in the UI
        uploaded_month = result.get('statement_month')
        uploaded_year = result.get('statement_year')

        import calendar
        if uploaded_month and uploaded_year:
            if uploaded_month != month or uploaded_year != year:
                uploaded_month_name = calendar.month_name[uploaded_month]
                expected_month_name = calendar.month_name[month]
                raise HTTPException(
                    status_code=400,
                    detail=f"Statement mismatch: This file is for {uploaded_month_name} {uploaded_year}, but you are viewing {expected_month_name} {year}."
                )

        # Upsert — overwrite if this month already exists
        existing = db.query(models.MonthlyBudget).filter_by(
            user_id=current_user.id, year=year, month=month
        ).first()

        if existing:
            existing.category_totals = result["category_totals"]
            existing.transactions = result["transactions"]
            existing.income = result.get("estimated_income", 0.0)
            existing.transaction_count = result["transaction_count"]
        else:
            record = models.MonthlyBudget(
                user_id=current_user.id,
                year=year,
                month=month,
                category_totals=result["category_totals"],
                transactions=result["transactions"],
                income=result.get("estimated_income", 0.0),
                transaction_count=result["transaction_count"],
            )
            db.add(record)

        db.commit()
        return {**result, "year": year, "month": month}

    except ValueError as e:
        # Catch specific password errors and pass through helpful message
        raise HTTPException(status_code=401 if "password" in str(e).lower() else 422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Statement processing failed: {str(e)}")


@app.get("/budgets", response_model=list[MonthSummary])
def list_uploaded_months(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """List all months that the current user has uploaded statements for."""
    print(f"DEBUG: Fetching budgets for user_id={current_user.id} (Username: {current_user.username})")
    records = db.query(models.MonthlyBudget).filter_by(user_id=current_user.id).all()
    print(f"DEBUG: Found {len(records)} budget records.")
    return [{"year": r.year, "month": r.month, "transaction_count": r.transaction_count} for r in records]


@app.get("/budgets/{year}/{month}", response_model=MonthlyBudgetResponse)
def get_monthly_budget(
    year: int,
    month: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Fetch the budget data for a specific month."""
    record = db.query(models.MonthlyBudget).filter_by(
        user_id=current_user.id, year=year, month=month
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="No data found for this month.")
    return record
