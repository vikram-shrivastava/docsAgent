import ConnectDB from "@/lib/dbConnect";
import Doc from "@/models/docs.model";
import Chat from "@/models/chat.model";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  await ConnectDB();

  try {
    /* --- AUTH --- */
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    const userId = decoded._id;

    /* --- INPUTS --- */
    const { query, docId, chatId } = await request.json();

    if (!query || !docId) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const doc = await Doc.findById(docId);
    if (!doc) return NextResponse.json({ message: "Doc not found" }, { status: 404 });

    /* --- PYTHON AI CALL --- */
    const pythonResponse = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        collection_name: doc._id.toString(),
        user_id: userId,
      }),
    });

    if (!pythonResponse.ok) throw new Error("Python server error");
    const pythonData = await pythonResponse.json();
    const assistantAnswer = pythonData.answer;

    /* --- SAVE TO DB (Using your Chat Model) --- */
    let chat;

    if (chatId) {
      // Update existing chat
      chat = await Chat.findOneAndUpdate(
        { _id: chatId, user: userId },
        {
          $push: {
            messages: {
              $each: [
                { role: "user", content: query },
                { role: "assistant", content: assistantAnswer },
              ],
            },
          },
        },
        { new: true }
      );
    } else {
      // Create new chat
      // Your Doc model has 'teamId', but Chat model has 'team'.
      // We must map doc.teamId -> chat.team
      const teamId = doc.teamId; 

      chat = await Chat.create({
        user: userId,
        team: teamId, 
        title: query.slice(0, 50),
        docId: doc._id,
        messages: [
          { role: "user", content: query },
          { role: "assistant", content: assistantAnswer },
        ],
      });
      await chat.save();
    }
    if(!chat) throw new Error("Chat save error");
    return NextResponse.json({
      success: true,
      answer: assistantAnswer,
      chatId: chat._id,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}