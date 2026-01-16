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