import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { execSync } from "child_process";

// --- Helpers --- //
import { getDuration } from '../helpers/getDuration.helper';

export class ImageAnimationService {

  public async generate_video(imagePath: string, musicPath: string): Promise<string> {
    const videoResources = path.resolve("./assets/video_resources");

    if (!fs.existsSync(videoResources)) {
      fs.mkdirSync(videoResources, { recursive: true });
    }

    const particles = path.join(videoResources, "particles.mp4");
    const lights = path.join(videoResources, "overlay.mp4");

    // Nome do arquivo final (pode ajustar conforme sua lógica)
    const outputPath = path.join(videoResources, "final_video_output.mp4");


    const tempParticles = path.join(videoResources, "temp_particles.mp4");
    const tempLights = path.join(videoResources, "temp_lights.mp4");
    const duration = Number(
      execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${musicPath}"`)
        .toString()
        .trim()
    );

    console.log(`🎬 Gerando vídeo animado para: ${path.basename(musicPath)}`);

    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Imagem não encontrada: ${imagePath}`);
      }

      execSync(
        `ffmpeg -stream_loop -1 -i "${particles}" -loop 1 -i "${imagePath}" -t ${duration} ` +
        `-filter_complex "[1:v][0:v]scale2ref[img][vid];[vid]format=rgba,colorchannelmixer=aa=0.25[ov];[img][ov]overlay,format=yuv420p" ` +
        `-shortest -y "${tempParticles}"`,
        { stdio: "inherit" }
      );

      execSync(
        `ffmpeg -stream_loop -1 -i "${lights}" -i "${tempParticles}" -t ${duration} ` +
        `-filter_complex "[0:v]format=rgba,colorchannelmixer=aa=0.2[ov];[1:v][ov]overlay,format=yuv420p" ` +
        `-shortest -y "${tempLights}"`,
        { stdio: "inherit" }
      );

      console.log("✅ Vídeo criado a partir da imagem com sucesso:", tempLights);
      return tempLights;

    } catch (error) {
      console.error("Falha ao gerar o vídeo:", error);
      throw error;
    }
  }
}