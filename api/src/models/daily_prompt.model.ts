import { Schema, model } from "mongoose";

export interface IDailyPrompt {
    date: string; // YYYY-MM-DD
    genre: 'lofi' | 'soul_worship' | 'jazz';
    prompt: string;
    imagePath: string;
    imageUrl?: string;
    generationStatus: 'pending' | 'success' | 'error';
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DailyPromptSchema = new Schema<IDailyPrompt>({
    date: { type: String, required: true },
    genre: { type: String, enum: ['lofi', 'soul_worship', 'jazz'], required: true },
    prompt: { type: String, required: true },
    imagePath: { type: String, default: '' },
    imageUrl: { type: String },
    generationStatus: {
        type: String,
        enum: ['pending', 'success', 'error'],
        default: 'pending'
    },
    errorMessage: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

DailyPromptSchema.index({ date: 1, genre: 1 }, { unique: true });

export const DailyPromptModel = model<IDailyPrompt>('DailyPrompt', DailyPromptSchema);
