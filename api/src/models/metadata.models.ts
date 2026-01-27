import mongoose, { Schema } from 'mongoose';
import { IMetadataResult } from '../interfaces/global.interface';

const MetadataSchema: Schema = new Schema({
    theme: { type: String, required: true },
    niche: { type: String, required: true },
    musicGenre: { type: String, required: true },
    language: { type: String, required: true },
    generatedTitle: { type: String, required: true },
    generatedDescription: { type: String, required: true },
    generatedKeywords: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IMetadataResult>('Metadata', MetadataSchema);