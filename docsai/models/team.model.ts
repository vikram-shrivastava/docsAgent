import mongoose, { Document, Model, Schema,Types  } from "mongoose"

export interface ITeam extends Document {
  teamName: string
  teamPassword: string
  maxMembers: number
  members: Types.ObjectId[]
  creator: Types.ObjectId
}

const TeamSchema=new Schema<ITeam>({
    creator:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    teamName:{
        type:String,
        required:true
    },
    teamPassword:{
        type:String,
        required:true
    },
    maxMembers:{
        type:Number,
        required:true
    },
    members:{
        type:[{type:Schema.Types.ObjectId,ref:"User"}],
        default:[]
    }
});
const Team: Model<ITeam> = mongoose.model("Team", TeamSchema);
export default Team;