import mongoose from "mongoose";

const DataDeletionRequestSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "not_found"],
    default: "pending",
  },
  requestedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  source: { type: String, default: "user" },
  facebookSignedRequest: { type: String },
});

export const DataDeletionRequest = mongoose.model("DataDeletionRequest", DataDeletionRequestSchema);
