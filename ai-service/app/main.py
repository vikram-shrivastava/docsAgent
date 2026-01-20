from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from schemas import CreatorRequest, ChatRequest
from creator import create_store
from graph import graph
from fastapi import WebSocket, WebSocketDisconnect
from langchain_core.messages import HumanMessage
import json
import uvicorn

load_dotenv()
app = FastAPI()

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


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            payload = json.loads(await websocket.receive_text())

            initial_state = {
                "messages": [HumanMessage(content=payload["query"])],
                "collection_name": payload["collection_name"],
                "user_id": payload["user_id"],
                "is_blocked": False
            }

            config = {
                "configurable": {"thread_id": payload["user_id"]}
            }

            for event in graph.stream(initial_state, config):
                for node_output in event.values():
                    if "messages" in node_output:
                        await websocket.send_json({
                            "type": "chunk",
                            "content": node_output["messages"][-1].content
                        })

    except WebSocketDisconnect:
        print("WebSocket disconnected")



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
