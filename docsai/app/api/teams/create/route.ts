import ConnectDB from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Team from "@/models/team.model";
import User from "@/models/user.model";
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

    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) return NextResponse.json({ message: "Team name taken" }, { status: 409 });

    // MODEL MATCH: 'creator' and 'members' are ObjectIds. 'maxMembers' is Number and REQUIRED.
    const team = await Team.create({
      teamName,
      teamPassword, 
      maxMembers: 10, // <--- ADDED THIS (Required by your Schema)
      members: [userId],
      creator: userId,
    });

    return NextResponse.json({ message: "Team created", team }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error creating team" }, { status: 500 });
  }
}