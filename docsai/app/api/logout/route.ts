import ConnectDB from "@/lib/dbConnect"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  await ConnectDB()

  try {
    const response = NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    )

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    })

    return response

  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
