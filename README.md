# AI Financial Analyst 📈

A comprehensive, agentic AI platform designed to modernize personal financial management. This project integrates cutting-edge AI reasoning (LangGraph + Gemini) with robust financial tracking to provide actionable, data-driven financial advice.

![AI Financial Analyst Demo](https://github.com/user-attachments/assets/your-demo-image-link)

## ✨ Core Features

- **🧠 Agentic Financial Analyst**: A hyper-confident AI advisor powered by **LangGraph** and **Google Gemini**. It provides direct, analytical advice on portfolio strategy, stock picks, and debt management.
- **📊 Portfolio Management**: Track your stock holdings in real-time. The AI analyzes your portfolio using **RAG (Retrieval-Augmented Generation)** with a **FAISS** vector database to suggest rebalancing and growth opportunities.
- **📑 Automated Bank Statement Parsing**: Upload your monthly bank statement PDFs (even password-protected). The system automatically parses, categorizes, and aggregates your transactions.
- **💰 Budgeting & Expense Tracking**: Dynamic monthly summaries of income vs. expenses, broken down by categories like food, travel, rent, and investments.
- **💹 Interactive Visualizations**: Beautiful, responsive charts powered by **Recharts** to visualize your financial health at a glance.
- **🔒 Secure Architecture**: JWT-based authentication ensures your financial data stays private and secure.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) (Animations)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) & [React Query](https://tanstack.com/query/latest)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **AI Orchestration**: [LangGraph](https://python.langchain.com/docs/langgraph) & [LangChain](https://python.langchain.com/)
- **LLM**: [Google Gemini 1.5 Flash/Pro](https://ai.google.dev/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via SQLAlchemy)
- **Vector Search**: [FAISS](https://github.com/facebookresearch/faiss)
- **Data Processing**: `PyPDF2` & `yfinance`

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- Python 3.10+
- Google Gemini API Key

### Setup & Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/heisenbergO312/ai-financial-analyst.git
   cd ai-financial-analyst
   ```

2. **Backend Configuration**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@db:5432/ai_financial_analyst
   GOOGLE_API_KEY=your_gemini_api_key
   SECRET_KEY=your_jwt_secret_key
   ```

3. **Frontend Configuration**
   Create a `.env` file in the `frontend/` directory (if needed for API URL):
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Run with Docker**
   ```bash
   docker-compose up --build
   ```

5. **Manual Setup (Development)**
   **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
   **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📂 Project Structure

```bash
ai_financial_analyst/
├── backend/            # FastAPI + LangGraph core
│   ├── app/            # Application logic (agent, models, tools)
│   ├── data/           # Temporary data storage & constants
│   └── scripts/        # Ingestion & maintenance scripts
├── frontend/           # Vite + React UI
│   ├── src/            # Components, features, and hooks
│   └── public/         # Static assets
└── docker-compose.yml  # Infrastructure orchestration
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue for any bugs/feature requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
