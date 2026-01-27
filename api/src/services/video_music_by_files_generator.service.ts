import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

// --- Interfaces --- //
import { VideoGeneratorInput, VideoGeneratorResult } from '../interfaces/global.interface';

// --- Helpers --- //
import { formatSrtTime } from '../helpers/formatSrtTime.helper';
import { formatTime } from '../helpers/formatTime.helper';
import { getDuration } from '../helpers/getDuration.helper';
import { runFfmpegConcat } from '../helpers/runFfmpegConcat.helper';

// --- Image Animation Service --- //
import { ImageAnimationService } from './image_animation_generator.service';

export class VideoMusicByFilesGeneratorService {

    public async generate_with_video(input: VideoGeneratorInput): Promise<VideoGeneratorResult> {
        const { audioDir, videoDir, outputFileName } = input;

        // Caminhos
        const inputVideoBase = path.join(videoDir, 'video_base.mp4');
        const outputFinalVideo = path.join(videoDir, outputFileName || 'video_base.mp4');

        // Caminhos temporários na pasta de áudio
        const listaFfmpegPath = path.join(audioDir, 'ffmpeg_concat.txt');
        const outputYoutubeChapters = path.join(audioDir, 'youtube_chapters.txt');
        const outputSrt = path.join(audioDir, 'legendas.srt');
        const outputPlaylistMp3 = path.join(audioDir, 'playlist_temp.mp3');

        // Validações
        if (!fs.existsSync(audioDir)) throw new Error(`Diretório de áudio não existe: ${audioDir}`);
        if (!fs.existsSync(videoDir)) throw new Error(`Diretório de vídeo não existe: ${videoDir}`);
        if (!fs.existsSync(inputVideoBase)) throw new Error(`Vídeo base não encontrado em: ${inputVideoBase}`);

        // 1. Escanear e Ordenar arquivos MP3
        const files = fs.readdirSync(audioDir)
            .filter(file => file.toLowerCase().endsWith('.mp3') && !file.startsWith('playlist_temp'))
            .sort((a, b) => a.localeCompare(b));

        if (files.length === 0) throw new Error("Nenhum arquivo .mp3 encontrado.");

        let ffmpegContent = '';
        let chaptersContent = '00:00 - Início\n';
        let srtContent = '';

        let currentTime = 0;
        let srtIndex = 1;

        console.log(`Processando ${files.length} músicas...`);

        // 2. Loop para gerar metadados e lista de concatenação
        for (const file of files) {
            const filePath = path.join(audioDir, file);

            // Fix para Windows no arquivo de texto do FFmpeg (escape de aspas simples)
            const safePath = filePath.replace(/\\/g, '/').replace(/'/g, "'\\''");

            ffmpegContent += `file '${safePath}'\n`;

            const duration = await getDuration(filePath);
            const nomeMusica = path.parse(file).name.replace(/_/g, ' ');

            // Timestamps para YouTube (Descrição)
            chaptersContent += `${formatTime(currentTime)} - ${nomeMusica}\n`;

            // Legendas SRT (Visual)
            const startTimeSrt = formatSrtTime(currentTime);
            const endTimeSrt = formatSrtTime(currentTime + duration);

            srtContent += `${srtIndex}\n`;
            srtContent += `${startTimeSrt} --> ${endTimeSrt}\n`;
            srtContent += `${nomeMusica}\n\n`;

            currentTime += duration;
            srtIndex++;
        }

        // 3. Escrever arquivos auxiliares
        fs.writeFileSync(listaFfmpegPath, ffmpegContent);
        fs.writeFileSync(outputYoutubeChapters, chaptersContent);
        fs.writeFileSync(outputSrt, srtContent);

        // 4. Gerar Áudio Unificado (Concatenação)
        console.log('Gerando áudio unificado (playlist_temp.mp3)...');

        if (fs.existsSync(outputPlaylistMp3)) fs.unlinkSync(outputPlaylistMp3);

        await runFfmpegConcat(listaFfmpegPath, outputPlaylistMp3);

        // 5. Gerar Vídeo Final (Loop de vídeo + Áudio unificado)
        console.log(`Renderizando vídeo final em: ${outputFinalVideo}...`);

        if (fs.existsSync(outputFinalVideo)) fs.unlinkSync(outputFinalVideo);

        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                .input(inputVideoBase)
                .inputOptions(['-stream_loop -1'])
                .input(outputPlaylistMp3)
                .outputOptions([
                    '-map 0:v:0',
                    '-map 1:a:0',
                    '-c:v copy',
                    '-c:a copy',
                    '-shortest'
                ])
                .output(outputFinalVideo)
                .on('end', () => {
                    console.log('FFmpeg finalizado com sucesso.');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Erro FFmpeg:', err);
                    reject(new Error(`Erro ao renderizar vídeo: ${err.message}`));
                })
                .run();
        });

        // Limpeza de arquivos temporários
        if (fs.existsSync(listaFfmpegPath)) fs.unlinkSync(listaFfmpegPath);
        if (fs.existsSync(outputPlaylistMp3)) fs.unlinkSync(outputPlaylistMp3);

        return {
            success: true,
            playlistPath: outputPlaylistMp3,
            videoPath: outputFinalVideo,
            timestampsPath: outputYoutubeChapters,
            duration: formatTime(currentTime)
        };
    }

    // public async generate_with_image(input: VideoGeneratorInput): Promise<VideoGeneratorResult> {
    //     const { audioDir, videoDir, imageDir, outputFileName } = input;
    //     const image_service = new ImageAnimationService()

    //     // Caminhos
    //     //const inputVideoBase = path.join(videoDir, 'video_base.mp4');
    //     const outputFinalVideo = path.join(videoDir, outputFileName || 'video_base.mp4');

    //     // Caminhos temporários na pasta de áudio
    //     const listaFfmpegPath = path.join(audioDir, 'ffmpeg_concat.txt');
    //     const outputYoutubeChapters = path.join(audioDir, 'youtube_chapters.txt');
    //     const outputSrt = path.join(audioDir, 'legendas.srt');
    //     const outputPlaylistMp3 = path.join(audioDir, 'playlist_temp.mp3');

    //     // Validações
    //     if (!fs.existsSync(audioDir)) throw new Error(`Diretório de áudio não existe: ${audioDir}`);
    //     if (!fs.existsSync(videoDir)) throw new Error(`Diretório de vídeo não existe: ${videoDir}`);
    //     //if (!fs.existsSync(inputVideoBase)) throw new Error(`Vídeo base não encontrado em: ${inputVideoBase}`);

    //     // 1. Escanear e Ordenar arquivos MP3
    //     const files = fs.readdirSync(audioDir)
    //         .filter(file => file.toLowerCase().endsWith('.mp3') && !file.startsWith('playlist_temp'))
    //         .sort((a, b) => a.localeCompare(b));

    //     if (files.length === 0) throw new Error("Nenhum arquivo .mp3 encontrado.");

    //     let ffmpegContent = '';
    //     let chaptersContent = '00:00 - Início\n';
    //     let srtContent = '';

    //     let currentTime = 0;
    //     let srtIndex = 1;

    //     console.log(`Processando ${files.length} músicas...`);

    //     // 2. Loop para gerar metadados e lista de concatenação
    //     for (const file of files) {
    //         const filePath = path.join(audioDir, file);

    //         // Fix para Windows no arquivo de texto do FFmpeg (escape de aspas simples)
    //         const safePath = filePath.replace(/\\/g, '/').replace(/'/g, "'\\''");

    //         ffmpegContent += `file '${safePath}'\n`;

    //         const duration = await getDuration(filePath);
    //         const nomeMusica = path.parse(file).name.replace(/_/g, ' ');

    //         // Timestamps para YouTube (Descrição)
    //         chaptersContent += `${formatTime(currentTime)} - ${nomeMusica}\n`;

    //         // Legendas SRT (Visual)
    //         const startTimeSrt = formatSrtTime(currentTime);
    //         const endTimeSrt = formatSrtTime(currentTime + duration);

    //         srtContent += `${srtIndex}\n`;
    //         srtContent += `${startTimeSrt} --> ${endTimeSrt}\n`;
    //         srtContent += `${nomeMusica}\n\n`;

    //         currentTime += duration;
    //         srtIndex++;
    //     }

    //     // 3. Escrever arquivos auxiliares
    //     fs.writeFileSync(listaFfmpegPath, ffmpegContent);
    //     fs.writeFileSync(outputYoutubeChapters, chaptersContent);
    //     fs.writeFileSync(outputSrt, srtContent);

    //     // 4. Gerar Áudio Unificado (Concatenação)
    //     console.log('Gerando áudio unificado (playlist_temp.mp3)...');

    //     if (fs.existsSync(outputPlaylistMp3)) fs.unlinkSync(outputPlaylistMp3);

    //     await runFfmpegConcat(listaFfmpegPath, outputPlaylistMp3);

    //     const image_video_path = await image_service.generate_video(imageDir || '', outputPlaylistMp3);

    //     // 5. Gerar Vídeo Final (Loop de vídeo + Áudio unificado)
    //     console.log(`Renderizando vídeo final em: ${outputFinalVideo}...`);

    //     if (fs.existsSync(outputFinalVideo)) fs.unlinkSync(outputFinalVideo);

    //     await new Promise<void>((resolve, reject) => {
    //         ffmpeg()
    //             .input(image_video_path)
    //             .inputOptions(['-stream_loop -1'])
    //             .input(outputPlaylistMp3)
    //             .outputOptions([
    //                 '-map 0:v:0',
    //                 '-map 1:a:0',
    //                 '-c:v copy',
    //                 '-c:a copy',
    //                 '-shortest'
    //             ])
    //             .output(outputFinalVideo)
    //             .on('end', () => {
    //                 console.log('FFmpeg finalizado com sucesso.');
    //                 resolve();
    //             })
    //             .on('error', (err) => {
    //                 console.error('Erro FFmpeg:', err);
    //                 reject(new Error(`Erro ao renderizar vídeo: ${err.message}`));
    //             })
    //             .run();
    //     });

    //     // Limpeza de arquivos temporários
    //     if (fs.existsSync(listaFfmpegPath)) fs.unlinkSync(listaFfmpegPath);
    //     if (fs.existsSync(outputPlaylistMp3)) fs.unlinkSync(outputPlaylistMp3);

    //     return {
    //         success: true,
    //         playlistPath: outputPlaylistMp3,
    //         videoPath: outputFinalVideo,
    //         timestampsPath: outputYoutubeChapters,
    //         duration: formatTime(currentTime)
    //     };
    // }

    // ... imports anteriores ...

    public async generate_with_image(input: VideoGeneratorInput): Promise<VideoGeneratorResult> {
        const { audioDir, videoDir, imageDir, outputFileName } = input;
        const image_service = new ImageAnimationService();

        const outputFinalVideo = path.join(videoDir, outputFileName || 'video_base.mp4');
        const listaFfmpegPath = path.join(audioDir, 'ffmpeg_concat.txt');
        const outputYoutubeChapters = path.join(audioDir, 'youtube_chapters.txt');
        const outputSrt = path.join(audioDir, 'legendas.srt');
        const outputPlaylistMp3 = path.join(audioDir, 'playlist_temp.mp3');

        if (!fs.existsSync(audioDir)) throw new Error(`Diretório de áudio não existe: ${audioDir}`);
        if (!fs.existsSync(videoDir)) throw new Error(`Diretório de vídeo não existe: ${videoDir}`);

        const files = fs.readdirSync(audioDir)
            .filter(file => file.toLowerCase().endsWith('.mp3') && !file.startsWith('playlist_temp'))
            .sort((a, b) => a.localeCompare(b));

        if (files.length === 0) throw new Error("Nenhum arquivo .mp3 encontrado.");

        let ffmpegContent = '';
        let chaptersContent = '00:00 - Início\n';
        let srtContent = '';
        let currentTime = 0;
        let srtIndex = 1;

        console.log(`Processando ${files.length} músicas...`);

        for (const file of files) {
            const filePath = path.join(audioDir, file);
            const safePath = filePath.replace(/\\/g, '/').replace(/'/g, "'\\''");

            ffmpegContent += `file '${safePath}'\n`;

            const duration = await getDuration(filePath);
            const nomeMusica = path.parse(file).name.replace(/_/g, ' ');

            chaptersContent += `${formatTime(currentTime)} - ${nomeMusica}\n`;

            const startTimeSrt = formatSrtTime(currentTime);
            const endTimeSrt = formatSrtTime(currentTime + duration);

            srtContent += `${srtIndex}\n`;
            srtContent += `${startTimeSrt} --> ${endTimeSrt}\n`;
            srtContent += `${nomeMusica}\n\n`;

            currentTime += duration;
            srtIndex++;
        }

        fs.writeFileSync(listaFfmpegPath, ffmpegContent);
        fs.writeFileSync(outputYoutubeChapters, chaptersContent);
        fs.writeFileSync(outputSrt, srtContent);

        console.log('Gerando áudio unificado (playlist_temp.mp3)...');
        if (fs.existsSync(outputPlaylistMp3)) fs.unlinkSync(outputPlaylistMp3);
        await runFfmpegConcat(listaFfmpegPath, outputPlaylistMp3);

        // OTIMIZAÇÃO: Gera apenas o loop visual curto (ex: 20s), independente do áudio
        const image_video_path = await image_service.generate_video(imageDir || '');

        console.log(`Renderizando vídeo final em: ${outputFinalVideo}...`);
        if (fs.existsSync(outputFinalVideo)) fs.unlinkSync(outputFinalVideo);

        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                // Entrada 0: Vídeo curto (Loop)
                .input(image_video_path)
                .inputOptions(['-stream_loop -1']) // Repete o vídeo infinitamente

                // Entrada 1: Áudio da Playlist
                .input(outputPlaylistMp3)

                .outputOptions([
                    '-map 0:v:0',
                    '-map 1:a:0',
                    '-c:v copy', // Copia o stream de vídeo (MUITO RÁPIDO)
                    '-c:a copy', // Copia o áudio sem re-encodar
                    '-shortest'  // Corta o vídeo quando o áudio acabar
                ])
                .output(outputFinalVideo)
                .on('end', () => {
                    console.log('FFmpeg finalizado com sucesso.');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('Erro FFmpeg:', err);
                    reject(new Error(`Erro ao renderizar vídeo: ${err.message}`));
                })
                .run();
        });

        if (fs.existsSync(listaFfmpegPath)) fs.unlinkSync(listaFfmpegPath);
        if (fs.existsSync(outputPlaylistMp3)) fs.unlinkSync(outputPlaylistMp3);

        return {
            success: true,
            playlistPath: outputPlaylistMp3,
            videoPath: outputFinalVideo,
            timestampsPath: outputYoutubeChapters,
            duration: formatTime(currentTime)
        };
    }

}