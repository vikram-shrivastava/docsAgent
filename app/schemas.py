from pydantic import BaseModel

class CreatorRequest(BaseModel):
    collection_name: str
    file_url: str

class ChatRequest(BaseModel):
    collection_name: str
    query: str
    user_id:str

