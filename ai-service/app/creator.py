from langchain_community.document_loaders import UnstructuredURLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from qdrant_client import QdrantClient
from langchain_qdrant import QdrantVectorStore
from langchain_community.document_loaders import PyPDFLoader
from dotenv import load_dotenv
import os

load_dotenv()
url=os.getenv("VECTOR_DB_URL")
api_key=os.getenv("VECTOR_DB_API_KEY")
def create_store(collection_name: str, file_url: str):
    loader = PyPDFLoader(file_path=file_url)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    docs = splitter.split_documents(docs)

    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001"
    )

    QdrantVectorStore.from_documents(
        documents=docs,
        url=url,
        api_key=api_key,
        collection_name=collection_name,
        embedding=embeddings,
    )

    return True
