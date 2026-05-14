import mongoose from "mongoose";

const PublishedVideoSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  title: { type: String },
  description: { type: String },
  thumbnailUrl: { type: String },
  channelId: { type: String },
  publishedAt: { type: Date },
  userId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export { PublishedVideoSchema };
export const PublishedVideoModel = mongoose.model("PublishedVideo", PublishedVideoSchema);

export class PublishedVideo {
  static getModel() {
    return PublishedVideoModel;
  }
}