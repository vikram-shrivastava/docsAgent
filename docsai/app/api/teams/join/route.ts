import ConnectDB from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Team from "@/models/team.model";
import Doc from "@/models/docs.model"; // Import Doc model to return docs
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  await ConnectDB();
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    const userId = decoded._id;

    const { teamName, teamPassword } = await request.json();

    const team = await Team.findOne({ teamName });
    if (!team) return NextResponse.json({ message: "Team not found" }, { status: 404 });

    // Simple password check (In production, use bcrypt compare)
    if (team.teamPassword !== teamPassword) {
      return NextResponse.json({ message: "Invalid Team Password" }, { status: 401 });
    }

    // Check if already a member
    if (!team.members.includes(userId)) {
      team.members.push(userId);
      await team.save();
    }

    // Fetch docs associated with this team
    const docs = await Doc.find({ teamId: team._id });

    return NextResponse.json({ 
      message: "Joined successfully", 
      teamId: team._id,
      docs: docs // Returning docs as requested
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Error joining team" }, { status: 500 });
  }
}