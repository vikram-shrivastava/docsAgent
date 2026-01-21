import ConnectDB from "@/lib/dbConnect";
import Doc from "@/models/docs.model";
import Chat from "@/models/chat.model";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface JwtPayload {
  _id: string;
  email: string;
}

export async function POST(request: Request) {
  await ConnectDB();

  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: Token missing" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as JwtPayload;
    } catch (err) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded._id;

    const { query, docId, chatId } = await request.json();

    if (!query || !docId) {
      return NextResponse.json(
        { message: "query and docId are required" },
        { status: 400 }
      );
    }

    const doc = await Doc.findById(docId);

    if (!doc) {
      return NextResponse.json(
        { message: "Document not found" },
        { status: 404 }
      );
    }

    // 1️⃣ Call Python AI server (UNCHANGED)
    const pythonResponse = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        collection_name: doc._id.toString(),
        user_id: userId,
      }),
    });

    if (!pythonResponse.ok) {
      return NextResponse.json(
        { message: "Python chat server failed" },
        { status: 500 }
      );
    }

    const pythonData = await pythonResponse.json();

    const assistantAnswer = pythonData.answer;

    // 2️⃣ Create new chat OR update existing one (Node-side only)
    let chat;

    if (chatId) {
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

      if (!chat) {
        return NextResponse.json(
          { message: "Chat not found" },
          { status: 404 }
        );
      }
    } else {
      const teamId=doc.teamId;
      if(!teamId){
        return NextResponse.json(
          { message: "Document is not associated with any team" },
          { status: 400 }
        );
      }

      chat = await Chat.create({
        user: userId,
        team: teamId,
        title: query.slice(0, 50),
        messages: [
          { role: "user", content: query },
          { role: "assistant", content: assistantAnswer },
        ],
      });
    }

    return NextResponse.json(
      {
        success: true,
        answer: assistantAnswer,
        chatId: chat._id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Chat Route Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
