import mongoose, { Document, Model, Schema } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: string
  refreshToken?: string,
  comparePassword(password: string): Promise<boolean>
  generateAccessToken(): string
  generateRefreshToken(): string
}

const userSchema = new Schema<IUser>({
  name: String,
  email: String,
  password: String,
  role: String,
  refreshToken: String,
})

userSchema.methods.comparePassword = async function (password: string) {
  return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET!, {
    expiresIn: "15m",
  })
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: "7d",
  })
}

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema)

export default User
