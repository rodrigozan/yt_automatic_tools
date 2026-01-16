import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

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

    console.log(`🎬 Gerando vídeo animado para: ${path.basename(musicPath)}`);

    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Imagem não encontrada: ${imagePath}`);
      }

      const duration = await getDuration(musicPath);

      // Envelopamos o processo do ffmpeg em uma Promise
      return new Promise((resolve, reject) => {
        ffmpeg()
          // 1. Input da Imagem (Loop infinito)
          .input(imagePath)
          .inputOptions(['-loop 1'])

          // 2. Input das Partículas (Stream Loop infinito)
          .input(particles)
          .inputOptions(['-stream_loop -1'])

          // 3. Input das Luzes (Stream Loop infinito)
          .input(lights)
          .inputOptions(['-stream_loop -1'])

          // Definição dos filtros complexos (chain)
          .complexFilter([
            // --- PADRONIZAÇÃO 1920x1080 (Evita erros de dimensão ímpar e padroniza para YT) ---

            // 1. Imagem Base: Escala para preencher 1920x1080 (crop se necessário) para não distorcer
            '[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080[base_std]',

            // 2. Partículas: Força escala 1920x1080
            '[1:v]scale=1920:1080[part_std]',

            // 3. Luzes: Força escala 1920x1080
            '[2:v]scale=1920:1080[lights_std]',

            // --- APLICAÇÃO DE EFEITOS ---

            // Transparência nas Partículas
            '[part_std]format=rgba,colorchannelmixer=aa=0.25[part_transp]',

            // Transparência nas Luzes
            '[lights_std]format=rgba,colorchannelmixer=aa=0.2[lights_transp]',

            // --- COMPOSIÇÃO FINAL ---
            '[base_std][part_transp]overlay[tmp]',
            '[tmp][lights_transp]overlay=format=yuv420p[final_output]'
          ], 'final_output')

          // Duração total baseada no áudio
          .duration(duration)

          // Configurações de saída
          .outputOptions([
            '-c:v libx264', // Codec de vídeo garantido
            '-pix_fmt yuv420p', // Garante compatibilidade com players (Quicktime/Windows)
            '-preset fast' // Agiliza o encode
          ])
          .output(outputPath)

          // Eventos de Log e Finalização
          .on('start', (commandLine) => {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
          })
          .on('error', (err) => {
            console.error('Erro no FFmpeg:', err);
            reject(err);
          })
          .on('end', () => {
            console.log('✅ Processamento finalizado!');
            resolve(outputPath);
          })
          .run();
      });

    } catch (error) {
      console.error("Falha ao gerar o vídeo:", error);
      throw error;
    }
  }
}