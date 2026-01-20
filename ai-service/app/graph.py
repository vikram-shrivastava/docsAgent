from langgraph.graph import StateGraph, START, END
from nodes.optimize_query import optimize_query
from nodes.multi_query import multi_query
from nodes.retrieve_query import retrieve_query
from nodes.selectdocs import selectdocs
from nodes.chatbot_node import chatbot_node
from utils.state import State

def route_after_optimize(state: State):
    return END if state["is_blocked"] else "multi_query"

graph_builder = StateGraph(State)

graph_builder.add_node("optimize_query", optimize_query)
graph_builder.add_node("multi_query", multi_query)
graph_builder.add_node("retrieve_query", retrieve_query)
graph_builder.add_node("selectdocs", selectdocs)
graph_builder.add_node("chatbot", chatbot_node)

graph_builder.add_edge(START, "optimize_query")

graph_builder.add_conditional_edges(
    "optimize_query",
    route_after_optimize
)

graph_builder.add_edge("multi_query", "retrieve_query")
graph_builder.add_edge("retrieve_query", "selectdocs")
graph_builder.add_edge("selectdocs", "chatbot")
graph_builder.add_edge("chatbot", END)

graph = graph_builder.compile()
