import ConnectDB from "@/lib/dbConnect";
import Chat from "@/models/chat.model";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(
  request: Request,
  props: { params: Promise<{ docId: string }> } // Next.js 15 Promise fix
) {
  await ConnectDB();

  try {
    const params = await props.params; // Await params
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    const userId = decoded._id;

    // Find the chat for THIS user and THIS document
    const chat = await Chat.findOne({
      user: userId,
      docId: params.docId
    });

    if (!chat) {
      // If no chat exists yet, return empty messages
      return NextResponse.json({ messages: [], chatId: null }, { status: 200 });
    }

    return NextResponse.json({ messages: chat.messages, chatId: chat._id }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}