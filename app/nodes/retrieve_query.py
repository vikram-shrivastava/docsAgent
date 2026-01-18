from langchain_qdrant import QdrantVectorStore
from utils.state import State
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os


QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001"
)
def retrieve_query(state: State) -> dict:
    vector_db = QdrantVectorStore.from_existing_collection(
        url=QDRANT_URL,
        collection_name=state["collection_name"],
        embedding=embeddings,
    )

    all_docs = []

    for query in state["multi_query"]:
        docs = vector_db.similarity_search(query, k=5)
        all_docs.extend(docs)

    return {
        "search_results": all_docs
    }
