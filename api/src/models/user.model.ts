import mongoose from "mongoose";

import { ChannelSchema } from "./channel.models";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  name: { type: String },
  picture: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  channels: [ChannelSchema],
  // Refresh token com escopo drive.file da conta Google pessoal, usado para
  // hospedar mídia publicamente para a Graph API do Meta.
  driveRefreshToken: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);