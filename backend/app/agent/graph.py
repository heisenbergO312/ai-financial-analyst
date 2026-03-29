from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition

from .state import AgentState
from .llm import get_llm

from app.tools.emi_calculator import calculate_no_cost_emi
from app.tools.credit_analysis import get_cibil_insights
from app.tools.document_parser import parse_financial_document
from app.tools.market_data import get_live_stock_price
from app.tools.portfolio_manager import get_personal_portfolio

def create_graph():
    """
    Creates and compiles the LangGraph workflow for the AI Financial Analyst.
    Uses conditional edges to route between the Language Model and the Tools.
    """
    
    # 1. Define the tools available to our agent
    tools_list = [
        calculate_no_cost_emi, 
        get_cibil_insights, 
        parse_financial_document,
        get_live_stock_price,
        get_personal_portfolio
    ]
    
    # 2. Setup the tool node which executes the tool calls
    tool_node = ToolNode(tools_list)
    
    # 3. Setup the LLM and bind the tools so the model knows what is available
    llm = get_llm()
    bound_model = llm.bind_tools(tools_list)
    
    # 4. Define the primary reasoning node
    def agent_node(state: AgentState):
        """
        Invokes the LLM bound with tools on the current message history.
        Returns the generated message, appending it to the state.
        """
        response = bound_model.invoke(state["messages"])
        return {"messages": [response]}
        
    # 5. Build the state graph
    workflow = StateGraph(AgentState)
    
    # Add our nodes
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tool_node)
    
    # 6. Define conditional edges
    # Standard flow starts at the agent
    workflow.set_entry_point("agent")
    
    # After the agent node, check if the LLM decided to call a tool
    # tools_condition routes to "tools" if a tool call was made, otherwise ENDs
    workflow.add_conditional_edges("agent", tools_condition)
    
    # After executing tools, always route back to the agent to interpret results
    workflow.add_edge("tools", "agent")
    
    # Compile the graph
    return workflow.compile()
