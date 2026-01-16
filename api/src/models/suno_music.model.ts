import { Schema, model } from "mongoose";

export interface ISunoMusic {
    sunoId: string;
    prompt: string;
    status: string; // 'queued', 'pending', 'streaming', 'complete', 'error'
    audioUrl?: string; // URL from Suno
    videoUrl?: string; // Video URL from Suno (if applicable)
    imageUrl?: string; // Cover image
    title?: string;
    model_name?: string;
    tags?: string;
    duration?: number;
    localPath?: string; // Path in assets/musics
    createdAt: Date;
    updatedAt: Date;
}

const SunoMusicSchema = new Schema<ISunoMusic>({
    sunoId: { type: String, required: true, unique: true },
    prompt: { type: String, required: true },
    status: { type: String, default: 'queued' },
    audioUrl: { type: String },
    videoUrl: { type: String },
    imageUrl: { type: String },
    title: { type: String },
    model_name: { type: String },
    tags: { type: String },
    duration: { type: Number },
    localPath: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const SunoMusicModel = model<ISunoMusic>('SunoMusic', SunoMusicSchema);
