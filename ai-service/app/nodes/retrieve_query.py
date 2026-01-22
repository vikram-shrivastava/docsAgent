from langchain_qdrant import QdrantVectorStore
from utils.state import State
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv
import os

load_dotenv()
url=os.getenv("VECTOR_DB_URL")
api_key=os.getenv("VECTOR_DB_API_KEY")
embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001"
)
def retrieve_query(state: State) -> dict:
    vector_db = QdrantVectorStore.from_existing_collection(
        url=url,
        api_key=api_key,
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
