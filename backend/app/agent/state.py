from typing import Annotated, Sequence, TypedDict
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    """
    Represents the state of our LangGraph agent.
    
    Attributes:
        messages: A list of messages. The `operator.add` annotation ensures that 
                  new messages are appended to the existing list rather than 
                  overwriting it during state updates.
    """
    messages: Annotated[Sequence[BaseMessage], operator.add]
