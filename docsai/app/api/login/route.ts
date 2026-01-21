import ConnectDB from "@/lib/dbConnect"
import { NextResponse } from "next/server"
import User from "@/models/user.model"

export async function POST(request: Request) {
  await ConnectDB()

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email })
    console.log(user)

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email" },
        { status: 401 }
      )
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid password" },
        { status: 401 }
      )
    }
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save()

    const response = NextResponse.json(
      {
        message: "Login successful",
        accessToken,
        user: { id: user._id, name: user.name, email: user.email },
      },
      { status: 200 }
    )

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, 
    })

    return response

  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    )
  }
}
