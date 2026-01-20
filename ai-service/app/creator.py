from langchain_community.document_loaders import UnstructuredURLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from qdrant_client import QdrantClient
from langchain_qdrant import QdrantVectorStore
from langchain_community.document_loaders import PyPDFLoader
from dotenv import load_dotenv
import os

load_dotenv()

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
        url="https://3731237b-00b6-475f-be6b-07f80f7671f7.europe-west3-0.gcp.cloud.qdrant.io",
        api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.6y_Qmy_JHhPubeO1lJc-4MdbkQ_ZQt1mBw-id5oGFpY",
        collection_name=collection_name,
        embedding=embeddings,
    )

    return True
