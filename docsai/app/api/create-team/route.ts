import ConnectDB from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import Team from "@/models/team.model";
import User from "@/models/user.model";
import jwt from "jsonwebtoken";

export async function POST(request: Request) {
  await ConnectDB();

  try {
    /* -------------------- AUTH -------------------- */
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    const decoded: any = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    );

    const userId = decoded._id;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { teamName, teamPassword } = await request.json();

    if (!teamName || !teamPassword) {
      return NextResponse.json(
        { message: "Team name and password are required" },
        { status: 400 }
      );
    }

    const existingTeam = await Team.findOne({ teamName });

    if (existingTeam) {
      return NextResponse.json(
        { message: "Team name already exists" },
        { status: 409 }
      );
    }

    const team = await Team.create({
      teamName,
      teamPassword,
      maxMembers: 10,
      members: [user._id],
      creator: user._id,
    });

    user.role = "creator";  
    await user.save();

    return NextResponse.json(
      {
        message: "Team created successfully",
        team,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Create Team Error:", error);

    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
