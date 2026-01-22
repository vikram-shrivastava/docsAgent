import ConnectDB from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Team from "@/models/team.model";
import Doc from "@/models/docs.model";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  await ConnectDB();
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    
    const params = await props.params;
    const teamId = params.id;
    console.log("Searching for Team ID:", teamId); // Debug Log
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const team = await Team.findById(teamId)
      .populate("creator", "name email")
      .populate("members", "name email");


    if (!team) return NextResponse.json({ message: "Team not found" }, { status: 404 });

    // Fetch docs for this team
    const docs = await Doc.find({ teamId: teamId }).sort({ createdAt: -1 });

    return NextResponse.json({ team, docs }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}