import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

// --- Interfaces --- //
import { VideoGeneratorInput, VideoGeneratorResult } from '../interfaces/global.interface';

// --- Helpers --- //
import { formatTime } from '../helpers/formatTime.helper';
import { getDuration } from '../helpers/getDuration.helper';
import { runFFmpegCommand } from '../helpers/runFFmpegCommand.helper';

// --- Image Animation Service --- //
import { ImageAnimationService } from './image_animation_generator.service';

export class VideoMusicPlaylistService {

    public async generate_with_video(input: VideoGeneratorInput): Promise<VideoGeneratorResult> {
        const { audioDir, videoDir, outputFileName } = input;

        // 1. Validação básica de segurança
        if (!fs.existsSync(audioDir)) throw new Error(`Diretório de áudio não encontrado: ${audioDir}`);
        if (!fs.existsSync(videoDir)) throw new Error(`Diretório de vídeo não encontrado: ${videoDir}`);

        const inputVideo = path.join(videoDir, 'video_base.mp4');
        const outputPlaylistMp3 = path.join(audioDir, 'playlist.mp3');
        const outputFinalVideo = path.join(videoDir, outputFileName || 'video_final.mp4');
        const listaFfmpeg = path.join(audioDir, 'lista_ffmpeg.txt');
        const listaTimestamps = path.join(audioDir, 'playlist.txt');

        if (!fs.existsSync(inputVideo)) throw new Error(`video_base.mp4 não encontrado em: ${videoDir}`);

        // 2. Escanear e processar metadados dos áudios
        const files = fs.readdirSync(audioDir)
            .filter(file => file.toLowerCase().endsWith('.mp3') && file !== 'playlist.mp3');

        if (files.length === 0) throw new Error("Nenhum arquivo .mp3 encontrado para gerar a playlist.");

        let ffmpegListContent = '';
        let timestampContent = '';
        let currentTime = 0;

        // Iterar arquivos
        for (const file of files) {
            const filePath = path.join(audioDir, file);
            const safePath = filePath.replace(/\\/g, '/'); // Fix para Windows no arquivo de texto

            ffmpegListContent += `file '${safePath}'\n`;

            const duration = await getDuration(filePath);
            const nomeMusica = file.replace('.mp3', '').replace(/_/g, ' ');

            timestampContent += `${formatTime(currentTime)} - ${nomeMusica}\n`;
            currentTime += duration;
        }

        // 3. Escrever arquivos auxiliares
        fs.writeFileSync(listaFfmpeg, ffmpegListContent);
        fs.writeFileSync(listaTimestamps, timestampContent);

        // 4. Gerar Playlist MP3 Unificada
        // Remove anterior se existir
        if (fs.existsSync(outputPlaylistMp3)) fs.unlinkSync(outputPlaylistMp3);

        await runFFmpegCommand(
            ffmpeg()
                .input(listaFfmpeg)
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions('-c copy')
                .output(outputPlaylistMp3)
        );

        // 5. Gerar Vídeo Final em Loop
        if (fs.existsSync(outputFinalVideo)) fs.unlinkSync(outputFinalVideo);

        await runFFmpegCommand(
            ffmpeg()
                .input(inputVideo)
                .inputOptions(['-stream_loop -1'])
                .input(outputPlaylistMp3)
                .outputOptions([
                    '-map 0:v',
                    '-map 1:a',
                    '-c:v copy',
                    '-c:a copy',
                    '-shortest'
                ])
                .output(outputFinalVideo)
        );

        // Limpeza (opcional)
        if (fs.existsSync(listaFfmpeg)) fs.unlinkSync(listaFfmpeg);

        return {
            success: true,
            playlistPath: outputPlaylistMp3,
            videoPath: outputFinalVideo,
            timestampsPath: listaTimestamps,
            duration: formatTime(currentTime)
        };
    }

    // public async generate_with_image(input: VideoGeneratorInput): Promise<VideoGeneratorResult> {
    //     const { audioDir, videoDir, imageDir, outputFileName } = input;
    //     const image_service = new ImageAnimationService()

    //     // 1. Validação básica de segurança
    //     if (!fs.existsSync(audioDir)) throw new Error(`Diretório de áudio não encontrado: ${audioDir}`);
    //     if (!fs.existsSync(videoDir)) throw new Error(`Diretório de vídeo não encontrado: ${videoDir}`);

    //     const outputPlaylistMp3 = path.join(audioDir, 'playlist.mp3');
    //     const outputFinalVideo = path.join(videoDir, outputFileName || 'video_final.mp4');
    //     const listaFfmpeg = path.join(audioDir, 'lista_ffmpeg.txt');
    //     const listaTimestamps = path.join(audioDir, 'playlist.txt');

    //     // 2. Escanear e processar metadados dos áudios
    //     const files = fs.readdirSync(audioDir)
    //         .filter(file => file.toLowerCase().endsWith('.mp3') && file !== 'playlist.mp3');

    //     if (files.length === 0) throw new Error("Nenhum arquivo .mp3 encontrado para gerar a playlist.");

    //     let ffmpegListContent = '';
    //     let timestampContent = '';
    //     let currentTime = 0;

    //     // Iterar arquivos
    //     for (const file of files) {
    //         const filePath = path.join(audioDir, file);
    //         const safePath = filePath.replace(/\\/g, '/'); // Fix para Windows no arquivo de texto

    //         ffmpegListContent += `file '${safePath}'\n`;

    //         const duration = await getDuration(filePath);
    //         const nomeMusica = file.replace('.mp3', '').replace(/_/g, ' ');

    //         timestampContent += `${formatTime(currentTime)} - ${nomeMusica}\n`;
    //         currentTime += duration;
    //     }

    //     // 3. Escrever arquivos auxiliares
    //     fs.writeFileSync(listaFfmpeg, ffmpegListContent);
    //     fs.writeFileSync(listaTimestamps, timestampContent);

    //     // 4. Gerar Playlist MP3 Unificada
    //     // Remove anterior se existir
    //     if (fs.existsSync(outputPlaylistMp3)) fs.unlinkSync(outputPlaylistMp3);

    //     await runFFmpegCommand(
    //         ffmpeg()
    //             .input(listaFfmpeg)
    //             .inputOptions(['-f concat', '-safe 0'])
    //             .outputOptions('-c copy')
    //             .output(outputPlaylistMp3)
    //     );

    //     const image_video_path = await image_service.generate_video(imageDir || '', outputPlaylistMp3);

    //     // 5. Gerar Vídeo Final em Loop
    //     if (fs.existsSync(outputFinalVideo)) fs.unlinkSync(outputFinalVideo);

    //     await runFFmpegCommand(
    //         ffmpeg()
    //             .input(image_video_path)
    //             .inputOptions(['-stream_loop -1'])
    //             .input(outputPlaylistMp3)
    //             .outputOptions([
    //                 '-map 0:v',
    //                 '-map 1:a',
    //                 '-c:v copy',
    //                 '-c:a copy',
    //                 '-shortest'
    //             ])
    //             .output(outputFinalVideo)
    //     );

    //     // Limpeza (opcional)
    //     if (fs.existsSync(listaFfmpeg)) fs.unlinkSync(listaFfmpeg);

    //     return {
    //         success: true,
    //         playlistPath: outputPlaylistMp3,
    //         videoPath: outputFinalVideo,
    //         timestampsPath: listaTimestamps,
    //         duration: formatTime(currentTime)
    //     };
    // }

    public async generate_with_image(input: VideoGeneratorInput): Promise<VideoGeneratorResult> {
        const { audioDir, videoDir, imageDir, outputFileName } = input;
        const image_service = new ImageAnimationService();

        // 1. Definição inteligente do arquivo de áudio
        let finalAudioPath = audioDir;

        // Se o usuário passou uma PASTA, procuramos 'playlist.mp3' dentro dela
        if (fs.existsSync(audioDir) && fs.lstatSync(audioDir).isDirectory()) {
            finalAudioPath = path.join(audioDir, 'playlist.mp3');
        }

        // Validações
        if (!fs.existsSync(finalAudioPath)) {
            throw new Error(`Arquivo de áudio não encontrado: ${finalAudioPath}`);
        }

        // Caminho de saída
        const outputFinalVideo = path.join(videoDir, outputFileName || 'video_final.mp4');

        // Pegar duração total para o retorno (opcional, mas útil)
        const durationSec = await getDuration(finalAudioPath);

        console.log(`🎵 Usando áudio base: ${path.basename(finalAudioPath)}`);

        // 2. Gera o Loop Visual Otimizado (ex: 20s)
        // Nota: Não passamos mais o áudio aqui, pois é independente
        const image_video_path = await image_service.generate_video(imageDir || '');

        // 3. Gerar Vídeo Final (Merge Rápido)
        console.log(`Renderizando vídeo final em: ${outputFinalVideo}...`);

        if (fs.existsSync(outputFinalVideo)) fs.unlinkSync(outputFinalVideo);

        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                // Input 0: Vídeo (Loop Visual)
                .input(image_video_path)
                .inputOptions(['-stream_loop -1']) // Repete infinitamente

                // Input 1: Áudio (Playlist pronta)
                .input(finalAudioPath)

                .outputOptions([
                    '-map 0:v',      // Usa vídeo do input 0
                    '-map 1:a',      // Usa áudio do input 1
                    '-c:v copy',     // Cópia direta (sem re-renderizar vídeo)
                    '-c:a copy',     // Cópia direta (sem re-renderizar áudio)
                    '-shortest'      // Corta quando o áudio acabar
                ])
                .output(outputFinalVideo)
                .on('end', () => {
                    console.log('✅ Merge final concluído.');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Erro FFmpeg:', err);
                    reject(new Error(`Erro ao renderizar vídeo: ${err.message}`));
                })
                .run();
        });

        return {
            success: true,
            playlistPath: finalAudioPath,
            videoPath: outputFinalVideo,
            timestampsPath: '', // Não geramos timestamps pois o áudio já veio pronto
            duration: formatTime(durationSec) // Função auxiliar sua de formatar tempo
        };
    }

}