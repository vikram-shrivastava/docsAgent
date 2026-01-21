import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Team from "@/models/team.model";
import ConnectDB from "@/lib/dbConnect";
import User from "@/models/user.model";


interface JwtPayload {
  _id: string;
  email: string;
}

export async function POST(request: Request) {
    await ConnectDB();
    try {
        const authHeader = request.headers.get("authorization");
        
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
              return NextResponse.json(
                { message: "Unauthorized: Token missing" },
                { status: 401 }
              );
            }
        
            const token = authHeader.split(" ")[1];
        
            let decoded: JwtPayload;
            try {
              decoded = jwt.verify(
                token,
                process.env.ACCESS_TOKEN_SECRET!
              ) as JwtPayload;
            } catch (err) {
              return NextResponse.json(
                { message: "Unauthorized: Invalid token" },
                { status: 401 }
              );
            }
        
            const userId = decoded._id; 

            const {teamName, teamPassword} = await request.json();

            if(!teamName || !teamPassword) {
                return NextResponse.json(
                    { message: "teamName and teamPassword are required" },
                    { status: 400 }
                  );
            }
            const team = await Team.findOne({ teamName: teamName });
            if(!team) {
                return NextResponse.json(
                    { message: "Team not found" },
                    { status: 404 }
                  );
            }
            if(team.teamPassword !== teamPassword) {
                return NextResponse.json(
                    { message: "Invalid team password" },
                    { status: 401 }
                  );
            }
            if(team.members.length >= team.maxMembers) {
                return NextResponse.json(
                    { message: "Team is already full" },
                    { status: 400 }
                    );
            }
            const members=await Team.findOne({_id:team._id,members:userId});
            if(members){
                return NextResponse.json(
                    { message: "User is already a member of the team" },
                    { status: 400 }
                  );
            }

            const user=await User.findById(userId);
            if(!user){
                return NextResponse.json(
                    { message: "User not found" },
                    { status: 404 }
                  );
            }
            team.members.push(user._id);
            await team.save();
            return NextResponse.json(
                { message: "Member added successfully" },
                { status: 200 }
              );
    } catch (error) {
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
          );   
    }
}