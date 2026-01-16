import mongoose from "mongoose";

import { ChannelSchema } from "./channel.models";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true },
  channels: [ChannelSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", UserSchema);