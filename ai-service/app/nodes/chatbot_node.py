from mem0 import MemoryClient
from langchain_core.messages import SystemMessage
from utils.llm import strong_llm
from utils.state import State
from dotenv import load_dotenv
import os
load_dotenv()
api_key = os.getenv("MEMORY_API_KEY")
mem0 = MemoryClient(api_key=api_key)

def chatbot_node(state: State) -> dict:
    messages = state["messages"]
    user_id = state["user_id"]


    filters={
        "OR":[
            {
                "user_id":user_id
            },
            {
                "agent_id":"*"
            }
        ]
    }

    memories = mem0.search(messages[-1].content,filters=filters)
    memory_list = memories.get("results", [])

    memory_context = "Relevant information from previous conversations:\n"
    for memory in memory_list:
        memory_context += f"- {memory['memory']}\n"


    doc_context = "\n\n".join(
        f"""
Source: {doc.metadata.get('source', 'N/A')}
Page Number: {doc.metadata.get('page_label', 'N/A')}
Content:
{doc.page_content}
"""
        for doc in state["common_results"]
    )


    system_prompt = SystemMessage(content=f"""
You are a helpful AI assistant.

Rules:
- Answer ONLY using the provided document context and memory context
- Mention page numbers when relevant
- Do NOT hallucinate
- End with: "For more information, refer to the relevant page number." if you are answering from document context.
- If you didn't find any relevant answer from document context refer to memory context.
- memory context has past memories of conversation between user and you may be user is refering that.
- if you answered from memory context End with "If you have any query relevant to docs tell me.
- If the answer is not present in document context and nor in memory context, say "I don't know"
- If user ask any other question not relevant to document or memory say "please be relevant to docs"


Document Context:
{doc_context}

Conversation Memory:
{memory_context}
""")

    full_messages = [system_prompt] + messages

    response = strong_llm.invoke(full_messages)

    try:
        interaction = [
            {"role": "user", "content": messages[-1].content},
            {"role": "assistant", "content": response.content}
        ]
        mem0.add(interaction, user_id=user_id)
    except Exception as e:
        print(f"Error saving memory: {e}")

    return {"messages": [response]}
