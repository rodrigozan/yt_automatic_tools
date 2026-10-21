import mongoose from "mongoose";

// Uma linha por tentativa de publicação (sucesso ou erro), inclusive as recusadas na validação.
const PublishLogSchema = new mongoose.Schema({
  agentId: { type: String },
  channelId: { type: String },
  videoPath: { type: String },
  title: { type: String },
  status: { type: String }, // status pedido (pode ser inválido, é guardado como veio)
  publishAt: { type: Date },
  result: { type: String, enum: ["success", "error"], required: true },
  videoId: { type: String },
  youtubeUrl: { type: String },
  error: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const PublishLogModel = mongoose.model("PublishLog", PublishLogSchema);
