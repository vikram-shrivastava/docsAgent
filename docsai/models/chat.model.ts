import mongoose, { Schema, Model, models } from "mongoose";

export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export interface IChat {
  user: mongoose.Types.ObjectId;
  team?: mongoose.Types.ObjectId;
  messages: IMessage[];
  title?: string;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ChatSchema = new Schema<IChat>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    team: { type: Schema.Types.ObjectId, ref: "Team" },
    messages: [MessageSchema],
    title: String,
  },
  { timestamps: true }
);

const Chat: Model<IChat> =
  models.Chat || mongoose.model<IChat>("Chat", ChatSchema);

export default Chat;
