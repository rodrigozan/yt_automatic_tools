import { Document } from 'mongoose';

export interface VideoGeneratorInput {
  audioDir: string;
  videoDir: string;
  imageDir?: string;
  outputFileName?: string;
}

export interface VideoGeneratorResult {
  success: boolean;
  playlistPath: string;
  videoPath: string;
  timestampsPath: string;
  duration: string;
}

export interface TrackItem {
  title: string;
  durationInSeconds?: number; // Opcional, se não tiver, gera sem timestamp
}

export interface IMetadataInput {
  theme: string;
  niche: string;
  musicGenre: string;
  language: string;
  timestampFile: string;
}

export interface IMetadataResult extends Document {
  theme: string;
  niche: string;
  musicGenre: string;
  language: string;
  timestampFile: string;
  generatedTitle: string;
  generatedDescription: string;
  generatedKeywords: string; // String única de 500 chars
  createdAt: Date;
}