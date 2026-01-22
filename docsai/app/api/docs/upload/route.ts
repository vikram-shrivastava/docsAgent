import ConnectDB from "@/lib/dbConnect";
import Doc from "@/models/docs.model";
import Team from "@/models/team.model";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  await ConnectDB();
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    const userId = decoded._id;

    // Frontend sends URL (from Cloudinary)
    const { teamId, title, uploaded_url } = await request.json();

    const team = await Team.findById(teamId);
    if (!team) return NextResponse.json({ message: "Team not found" }, { status: 404 });

    // Security: Only creator can upload
    if (team.creator.toString() !== userId) {
        return NextResponse.json({ message: "Only creator can upload" }, { status: 403 });
    }

    const newDoc = await Doc.create({
      userId,
      teamId,
      title,
      uploaded_url,
    });

    // Call Python Server
    try {
        await fetch(`${process.env.AI_SERVICE_URL}/create-room`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                collection_name: newDoc._id.toString(),
                file_url: uploaded_url,
            }),
        });
    } catch (pythonError) {
        console.error("Python Server Error", pythonError);
        // We continue even if python fails, or you can delete the doc here
    }

    return NextResponse.json({ message: "Uploaded", doc: newDoc }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}