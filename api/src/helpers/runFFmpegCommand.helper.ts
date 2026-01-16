import ffmpeg from "fluent-ffmpeg";

export const runFFmpegCommand = (command: ffmpeg.FfmpegCommand): Promise<void> => {
  return new Promise((resolve, reject) => {
    command
      .on("error", (err: Error) => reject(err))
      .on("end", () => resolve())
      .run();
  });
};
