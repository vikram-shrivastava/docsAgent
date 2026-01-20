import ConnectDB from "@/lib/dbConnect"
import { NextResponse } from "next/server"
import Team from "@/models/team.model"
import User from "@/models/user.model"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

export async function GET(request: Request) {
  await ConnectDB()

  try {
    // 🔐 Auth
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - No token provided" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]

    const decoded: any = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    )

    const userId = new mongoose.Types.ObjectId(decoded._id)

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    // 🔎 Get all teams where user involved
    const teams = await Team.find({
      $or: [
        { creator: userId },
        { members: userId },
      ],
    })
      .populate("creator", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 })

    // 🧠 Split logic
    const createdTeams = []
    const memberTeams = []

    for (const team of teams) {
      if (team.creator._id.toString() === userId.toString()) {
        createdTeams.push(team)
      } else {
        memberTeams.push(team)
      }
    }

    return NextResponse.json(
      {
        createdTeams,
        memberTeams,
        total: teams.length,
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error(error)

    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
