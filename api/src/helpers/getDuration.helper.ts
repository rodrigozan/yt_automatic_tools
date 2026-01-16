import ffmpeg from 'fluent-ffmpeg';

export const getDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
      if (err) return reject(err);
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
};
