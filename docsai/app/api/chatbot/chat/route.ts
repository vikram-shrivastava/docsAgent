import ConnectDB from "@/lib/dbConnect";
import Doc from "@/models/docs.model";
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

    const { query, docId } = await request.json();

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

    return NextResponse.json(
      {
        success: true,
        answer: pythonData.answer,
        thread_id: pythonData.thread_id,
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
