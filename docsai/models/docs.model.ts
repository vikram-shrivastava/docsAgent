import mongoose, { Document, Model, Schema } from "mongoose"

export interface IDoc extends Document {
    title: string,
    uploaded_url: string,
    userId: mongoose.Types.ObjectId,
    teamId:mongoose.Types.ObjectId
    createdAt: Date,
    updatedAt: Date
}

const docSchema = new Schema<IDoc>({
    title: { type: String, required: true },
    uploaded_url: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teamId:{type:mongoose.Schema.Types.ObjectId, ref:"Team"}
}, { timestamps: true })

const Doc: Model<IDoc> = mongoose.models.Doc || mongoose.model<IDoc>("Doc", docSchema)
export default Doc