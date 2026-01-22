import ConnectDB from "@/lib/dbConnect"
import { NextResponse } from "next/server"
import Team from "@/models/team.model"
import User from "@/models/user.model"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

interface Params {
  id: string
}

export async function POST(
 request: Request,
  props: { params: Promise<{ id: string }> }
) {
  await ConnectDB()

  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - No token provided" },
        { status: 401 }
      )
    }
    const token = authHeader.split(" ")[1]

    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!)
    const userId = new mongoose.Types.ObjectId(decoded._id)

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }
    const params = await props.params;
    const teamId = params.id
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ message: "Invalid team ID" }, { status: 400 })
    }

    const team = await Team.findById(teamId)
    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 })
    }

    if (team.creator.toString() !== userId.toString()) {
      return NextResponse.json(
        { message: "Forbidden - Only creator can delete this team" },
        { status: 403 }
      )
    }

    await team.deleteOne()

    return NextResponse.json(
      { message: "Team deleted successfully" },
      { status: 200 }
    )

  } catch (error: any) {
    console.error(error)
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
