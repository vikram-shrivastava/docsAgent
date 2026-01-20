from mem0 import MemoryClient
from langchain_core.messages import SystemMessage
from utils.llm import strong_llm
from utils.state import State

mem0 = MemoryClient(api_key="m0-Uw4gJV6DjVRWK2X9ht0BxIJijmDd5WenfY8I3M9l")

def chatbot_node(state: State) -> dict:
    messages = state["messages"]
    user_id = state["user_id"]

    # --------------------------------------------------
    # 🔹 Fetch long-term memory
    # --------------------------------------------------
    memories = mem0.search(messages[-1].content, user_id=user_id)
    memory_list = memories.get("results", [])

    memory_context = "Relevant information from previous conversations:\n"
    for memory in memory_list:
        memory_context += f"- {memory['memory']}\n"

    # --------------------------------------------------
    # 🔹 Convert retrieved documents into text context
    # --------------------------------------------------
    doc_context = "\n\n".join(
        f"""
Source: {doc.metadata.get('source', 'N/A')}
Page Number: {doc.metadata.get('page_label', 'N/A')}
Content:
{doc.page_content}
"""
        for doc in state["common_results"]
    )

    # --------------------------------------------------
    # 🔹 System prompt
    # --------------------------------------------------
    system_prompt = SystemMessage(content=f"""
You are a helpful AI assistant.

Rules:
- Answer ONLY using the provided document context
- Mention page numbers when relevant
- If the answer is not present, say "I don't know"
- Do NOT hallucinate
- End with: "For more information, refer to the relevant page number."

Document Context:
{doc_context}

Conversation Memory:
{memory_context}
""")

    full_messages = [system_prompt] + messages

    response = strong_llm.invoke(full_messages)

    # --------------------------------------------------
    # 🔹 Save memory
    # --------------------------------------------------
    try:
        interaction = [
            {"role": "user", "content": messages[-1].content},
            {"role": "assistant", "content": response.content}
        ]
        mem0.add(interaction, user_id=user_id)
    except Exception as e:
        print(f"Error saving memory: {e}")

    return {"messages": [response]}
