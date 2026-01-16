import ffmpeg from "fluent-ffmpeg";

export const runFfmpegConcat = (listPath: string, outputPath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions("-c copy")
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(new Error(`Erro concat: ${err.message}`)))
      .run();
  });
};
