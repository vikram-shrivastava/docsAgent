import ConnectDB from "@/lib/dbConnect";
import Doc from "@/models/docs.model";
import Team from "@/models/team.model";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

interface JwtPayload {
  _id: string;
  email: string;
}

export async function POST(request: Request) {
  await ConnectDB();

  try {
    /* -------------------- AUTH PART -------------------- */
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

    const { teamId, title, uploaded_url } = await request.json();

    if (!teamId || !title || !uploaded_url) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json(
        { message: "Team not found" },
        { status: 404 }
      );
    }

    const newDoc = await Doc.create({
      userId,
      teamId,
      title,
      uploaded_url,
    });

    const pythonResponse = await fetch("http://localhost:8000/create-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        collection_name: newDoc._id.toString(),
        file_url: uploaded_url,
      }),
    });

    if (!pythonResponse.ok) {
      return NextResponse.json(
        { message: "Python server failed to process document" },
        { status: 500 }
      );
    }

    const pythonData = await pythonResponse.json();

    return NextResponse.json(
      {
        message: "Document uploaded successfully",
        doc: newDoc,
        python: pythonData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload Doc Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
