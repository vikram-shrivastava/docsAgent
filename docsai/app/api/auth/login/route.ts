import ConnectDB from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import User from "@/models/user.model";

export async function POST(request: Request) {
  await ConnectDB();
  try {
    const { email, password } = await request.json();
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    
    user.refreshToken = refreshToken;
    await user.save();

    const response = NextResponse.json(
      { 
        message: "Login successful", 
        accessToken, 
        user: { id: user._id, name: user.name, email: user.email } 
      }, 
      { status: 200 }
    );

    // Set cookie
    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}