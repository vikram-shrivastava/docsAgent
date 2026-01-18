from utils.llm import fast_llm
from utils.state import State
from langchain_core.messages import SystemMessage, HumanMessage

def multi_query(state:State)->dict:
    system_prompt=SystemMessage(content="""
    Generate 3–5 semantically different search queries
based on the given query.
Return each query on a new line.
    
    Example 1:
    user_query:file system in js
    multi_query:["What is the file system in JavaScript?","How does file handling work in JavaScript?", "Basics of reading and writing files in JS.", "Introduction to file system module in Node.js."]

    Example 2:
    user_query: differentiate between asynchronous and synchronous in js
    multi_query:["Event loop behavior in synchronous vs asynchronous JS.", "How JavaScript handles synchronous and asynchronous tasks internally.", "Differences between blocking and non-blocking operations in JS.", "Promises vs synchronous execution in JavaScript."]

    Example 3:
    user_query: Dom is js
    multi_query: ["Explain DOM and its importance in JavaScript.","How the DOM tree works in JavaScript?","Differences between HTMLCollection, NodeList, and DOM elements.","Best practices for selecting DOM elements in JavaScript."]
    """)

    response = fast_llm.invoke([
        system_prompt,
        HumanMessage(content=state["optimized_query"])
    ])

    queries = [
        q.strip()
        for q in response.content.split("\n")
        if q.strip()
    ]

    return {
        "multi_query": queries
    }