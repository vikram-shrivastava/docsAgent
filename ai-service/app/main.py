from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from schemas import CreatorRequest, ChatRequest
from creator import create_store
from graph import graph
from fastapi import WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage
from fastapi.middleware.cors import CORSMiddleware
import json
import uvicorn

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ok"}

@app.post("/create-room")
async def create_room(request: CreatorRequest):
    try:
        create_store(
            collection_name=request.collection_name,
            file_url=request.file_url
        )
        return {"message": "Room created and document indexed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        
        query=request.query
        collection_name=request.collection_name
        user_id=request.user_id

        if not query or not collection_name or not user_id:
            raise HTTPException(status_code=400, detail="Missing required fields")

        initial_state = {
            "messages": [HumanMessage(content=query)],
            "collection_name": collection_name,
            "user_id": user_id,
            "is_blocked": False
        }

        config = {
            "configurable": {"thread_id": user_id}
        }

        result = graph.invoke(initial_state, config)

        final_message = None
        if "messages" in result and len(result["messages"]) > 0:
            final_message = result["messages"][-1].content

        return {
            "success": True,
            "answer": final_message,
            "thread_id": user_id,
        }

    except Exception as e:
        print("Chat Error:", e)
        raise HTTPException(status_code=500, detail="Chat processing failed")



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
