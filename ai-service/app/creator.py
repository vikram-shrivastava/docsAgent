from langchain_community.document_loaders import UnstructuredURLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from dotenv import load_dotenv
import os

load_dotenv()

def create_store(collection_name: str, file_url: str):
    loader = UnstructuredURLLoader(urls=[file_url])
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
        url=os.getenv("QDRANT_URL", "http://vector-db:6333"),
        collection_name=collection_name,
        embedding=embeddings,
    )

    return True
