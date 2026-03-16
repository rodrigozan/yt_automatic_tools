import{ Schema } from "mongoose";

export const ChannelSchema = new Schema({
  channelId: { type: String },
  channelName: { type: String },
  channelNickname: { type: String },
  channelPath: { type: String },
  channelGenre: { type: String },
  channelType: { type: String },
  refreshToken: { type: String },
  spotifyProfile: { type: String },
  youtubeChannel: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
