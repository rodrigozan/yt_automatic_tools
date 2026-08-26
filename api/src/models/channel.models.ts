import{ Schema } from "mongoose";

export const MetaConnectionSchema = new Schema(
  {
    pageId: { type: String },
    pageName: { type: String },
    pageAccessToken: { type: String },
    metaUserId: { type: String },
    igUserId: { type: String },
    igUsername: { type: String },
    connectedAt: { type: Date },
    updatedAt: { type: Date },
  },
  { _id: false }
);

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
  instagramProfile: { type: String },
  tiktokProfile: { type: String },
  meta: { type: MetaConnectionSchema, default: undefined },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
