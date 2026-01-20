from langchain_qdrant import QdrantVectorStore
from utils.state import State
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os


embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001"
)
def retrieve_query(state: State) -> dict:
    vector_db = QdrantVectorStore.from_existing_collection(
        url="https://3731237b-00b6-475f-be6b-07f80f7671f7.europe-west3-0.gcp.cloud.qdrant.io",
        api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.6y_Qmy_JHhPubeO1lJc-4MdbkQ_ZQt1mBw-id5oGFpY",
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
