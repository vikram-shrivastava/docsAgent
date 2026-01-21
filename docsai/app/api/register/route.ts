import ConnectDB from "@/lib/dbConnect";
import {NextResponse} from "next/server"
import User from "@/models/user.model";
import bcrypt from "bcrypt";
export async function POST(request:Request){
    ConnectDB()
    try {
        const {name,email,password}=await request.json()
        if(!name || !email || !password){
            return NextResponse.json({message:"All fields are required"}, {status:400})
        }
        const existingUser=await User.findOne({email})
        if(existingUser){
            return NextResponse.json({message:"User already exists"}, {status:400})
        }
        const hashedPassword=await bcrypt.hash(password,10)
        const newUser=new User({name,email,password: hashedPassword})
        await newUser.save()
        return NextResponse.json({message:"User registered successfully", user: { id: newUser._id, name: newUser.name, email: newUser.email }}, {status:201})
    } catch (error) {
        return NextResponse.json({message:"Internal Server Error"}, {status:500})
    }
}