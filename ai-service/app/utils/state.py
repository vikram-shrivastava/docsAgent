from typing_extensions import TypedDict
from typing import Annotated
from langgraph.graph.message import add_messages
from langchain_core.documents import Document

class State(TypedDict):
    messages: Annotated[list, add_messages]
    collection_name: str
    optimized_query:str
    multi_query:list[str]
    search_results:list[Document]
    common_results:list[Document]
    user_id:str
    is_blocked:bool