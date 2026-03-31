import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';

import { getDuration } from '../helpers/getDuration.helper';

// ---- Types ---- //

export interface IndividualVideoInput {
  /** Pasta que contém as imagens (01.jpeg … 06.jpeg) e os mp3s (01 - … .mp3) */
  sourceDir: string;
  /** Pasta de saída para os vídeos gerados. Caso omitida, usa sourceDir */
  outputDir?: string;
}

export interface IndividualVideoResult {
  success: boolean;
  generated: { imageName: string; audioName: string; videoPath: string; duration: string }[];
  errors: { imageName: string; audioName?: string; error: string }[];
}

// ---- Service ---- //

export class VideoIndividualGeneratorService {

  /** Recursos de efeitos (particles.mp4 e overlay.mp4) – mesma pasta usada pela ImageAnimationService */
  private readonly videoResources = path.resolve('./assets/video_resources');

  public async generate(input: IndividualVideoInput): Promise<IndividualVideoResult> {
    const { sourceDir } = input;
    const outputDir = input.outputDir || sourceDir;

    if (!fs.existsSync(sourceDir)) {
      throw new Error(`Diretório de origem não existe: ${sourceDir}`);
    }

    fs.mkdirSync(outputDir, { recursive: true });

    const particles = path.join(this.videoResources, 'particles.mp4');
    const lights    = path.join(this.videoResources, 'overlay.mp4');

    if (!fs.existsSync(particles)) throw new Error(`Arquivo de efeito não encontrado: ${particles}`);
    if (!fs.existsSync(lights))    throw new Error(`Arquivo de efeito não encontrado: ${lights}`);

    // 1. Listar imagens válidas (01.jpeg … 06.jpeg / .jpg / .png / .webp)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const images = fs.readdirSync(sourceDir)
      .filter(f => imageExtensions.includes(path.extname(f).toLowerCase()))
      .filter(f => /^\d{2}/.test(f))   // começa com dois dígitos
      .sort((a, b) => a.localeCompare(b));

    if (images.length === 0) throw new Error(`Nenhuma imagem válida (01.jpeg…) encontrada em: ${sourceDir}`);

    // 2. Listar mp3s disponíveis
    const mp3s = fs.readdirSync(sourceDir)
      .filter(f => f.toLowerCase().endsWith('.mp3'))
      .sort((a, b) => a.localeCompare(b));

    if (mp3s.length === 0) throw new Error(`Nenhum arquivo .mp3 encontrado em: ${sourceDir}`);

    const generated: IndividualVideoResult['generated'] = [];
    const errors:    IndividualVideoResult['errors']    = [];

    // 3. Para cada imagem, encontra o mp3 de mesmo prefixo numérico
    for (const imageFile of images) {
      const prefix = imageFile.match(/^(\d{2})/)?.[1]; // '01', '02' …

      if (!prefix) {
        errors.push({ imageName: imageFile, error: 'Prefixo numérico não identificado.' });
        continue;
      }

      const matchedMp3 = mp3s.find(m => m.startsWith(prefix));

      if (!matchedMp3) {
        errors.push({ imageName: imageFile, error: `Nenhum mp3 encontrado com prefixo '${prefix}'.` });
        continue;
      }

      const imagePath = path.join(sourceDir, imageFile);
      const mp3Path   = path.join(sourceDir, matchedMp3);
      const baseName  = path.parse(matchedMp3).name; // ex: '01 - Aleluia'
      const outputVideoPath = path.join(outputDir, `${baseName}.mp4`);

      console.log(`\n🎬 [${prefix}] Processando: ${imageFile}  +  ${matchedMp3}`);

      try {
        // ── Pega a duração real do mp3 ANTES de qualquer passo ──
        const mp3Duration = await getDuration(mp3Path);
        console.log(`⏱️  Duração da música: ${mp3Duration.toFixed(2)}s`);

        const tempParticles = path.join(outputDir, `_temp_particles_${prefix}.mp4`);
        const tempLoop      = path.join(outputDir, `_temp_loop_${prefix}.mp4`);

        // ── Passo A: Imagem + Partículas (duração = tamanho exato do mp3) ──
        execSync(
          `ffmpeg -y -stream_loop -1 -i "${particles}" -loop 1 -i "${imagePath}" -t ${mp3Duration} ` +
          `-filter_complex "[1:v][0:v]scale2ref[img][vid];[vid]format=rgba,colorchannelmixer=aa=0.25[ov];[img][ov]overlay,format=yuv420p" ` +
          `-shortest "${tempParticles}"`,
          { stdio: 'inherit' }
        );

        // ── Passo B: Adiciona overlay de luzes (mesma duração) ──
        execSync(
          `ffmpeg -y -stream_loop -1 -i "${lights}" -i "${tempParticles}" -t ${mp3Duration} ` +
          `-filter_complex "[0:v]format=rgba,colorchannelmixer=aa=0.2[ov];[1:v][ov]overlay,format=yuv420p" ` +
          `-shortest "${tempLoop}"`,
          { stdio: 'inherit' }
        );

        // Remove temp intermediário
        if (fs.existsSync(tempParticles)) fs.unlinkSync(tempParticles);

        await new Promise<void>((resolve, reject) => {
          ffmpeg()
            .input(tempLoop)
            .inputOptions(['-stream_loop -1'])
            .input(mp3Path)
            .outputOptions([
              '-map 0:v:0',
              '-map 1:a:0',
              '-c:v copy',
              '-c:a copy',
              '-shortest'
            ])
            .output(outputVideoPath)
            .on('end', () => {
              console.log(`✅ Vídeo gerado: ${outputVideoPath}`);
              resolve();
            })
            .on('error', (err) => {
              console.error(`❌ Erro FFmpeg:`, err);
              reject(new Error(`Erro ao renderizar vídeo: ${err.message}`));
            })
            .run();
        });

        // Remove loop temporário
        if (fs.existsSync(tempLoop)) fs.unlinkSync(tempLoop);

        const minutes = Math.floor(mp3Duration / 60);
        const seconds = Math.floor(mp3Duration % 60);
        const durationStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        generated.push({
          imageName: imageFile,
          audioName: matchedMp3,
          videoPath: outputVideoPath,
          duration: durationStr
        });

      } catch (err: any) {
        console.error(`❌ Falha ao processar [${prefix}]:`, err.message);
        errors.push({ imageName: imageFile, audioName: matchedMp3, error: err.message });
      }
    }

    return { success: errors.length === 0, generated, errors };
  }
}
