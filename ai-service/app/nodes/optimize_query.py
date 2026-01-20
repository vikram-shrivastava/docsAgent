from langchain_core.messages import SystemMessage, HumanMessage
from utils.llm import fast_llm
from utils.state import State
def optimize_query(state: State) -> dict:
    system_prompt = SystemMessage(content="""
You are a query optimizing agent.

Rules:
1. If the query contains abusive or inappropriate language,
   respond ONLY with: "Please use proper and respectful language."
2. Fix grammar and spelling mistakes.
3. Add missing technical context if needed.
4. Return ONLY the final optimized query.
""")

    user_query = state["messages"][-1].content

    response = fast_llm.invoke([
        system_prompt,
        HumanMessage(content=user_query)
    ])

    content = response.content.strip()

    if content.lower().startswith("please use proper"):
        return {
            "is_blocked": True,
            "messages": [response]
        }

    return {
        "optimized_query": content,
        "is_blocked": False
    }
