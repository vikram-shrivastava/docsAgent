import ConnectDB from "@/lib/dbConnect"
import { NextResponse } from "next/server"
import Team from "@/models/team.model"
import User from "@/models/user.model"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

interface Params {
  id: string
}

export async function GET(
  request: Request,
  { params }: { params: Params }
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

    const teamId = params.id

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ message: "Invalid team ID" }, { status: 400 })
    }

    // 5️⃣ Fetch team
    const team = await Team.findById(teamId)
      .populate("creator", "name email")
      .populate("members", "name email")

    if (!team) {
      return NextResponse.json({ message: "Team not found" }, { status: 404 })
    }

    const isCreator = team.creator._id.toString() === userId.toString()
    const isMember = team.members.some(
      (m: any) => m._id.toString() === userId.toString()
    )

    if (!isCreator && !isMember) {
      return NextResponse.json(
        { message: "Forbidden - You are not part of this team" },
        { status: 403 }
      )
    }

    const role = isCreator ? "creator" : "member"

    return NextResponse.json({ team, role }, { status: 200 })

  } catch (error: any) {
    console.error(error)
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
