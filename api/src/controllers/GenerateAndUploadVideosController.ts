import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { VideoMusicByFilesGeneratorService } from '../services/video_music_by_files_generator.service';
import { VideoMusicPlaylistService } from '../services/video_music_playlist_generator.service';
import { YtUploadVideoService } from '../services/yt_upload_video.service';
import { PromptGeneratorService } from '../services/prompt_generator.service';
import { GeminiImageGeneratorService } from '../services/gemini_image_generator.service';

export class GenerateAndUploadVideosController {
    private playlist_service: VideoMusicPlaylistService;
    private by_files_service: VideoMusicByFilesGeneratorService;

    constructor() {
        this.playlist_service = new VideoMusicPlaylistService();
        this.by_files_service = new VideoMusicByFilesGeneratorService();
    }

    /**
     * Orchestrates video generation and YouTube upload.
     */
    public generateAndUpload = async (req: Request, res: Response): Promise<void> => {
        try {
            const {
                // Generation Params
                audioDir,
                audioDirs,   // array sent by frontend when generationType === 'files'
                videoDir,
                imageDir,
                outputName,
                generationType, // 'playlist' | 'files'
                generationSource, // 'video' | 'image' | 'auto_image'

                // Upload Params
                theme,
                email,
                channelId,
                channelType,
                refreshToken,
                channelLang = 'en',
                forceStyle,
                niche,
                musicGenre
            } = req.body;

            // 1. Basic Validation
            if (!theme || !email || !channelId || !channelType) {
                res.status(400).json({
                    error: 'Faltam parâmetros obrigatórios: theme, email, channelId, channelType.'
                });
                return;
            }

            if (generationType === 'files') {
                if (!audioDirs || !Array.isArray(audioDirs) || audioDirs.length === 0) {
                    res.status(400).json({
                        error: 'Falta parâmetro obrigatório: audioDirs deve ser um array não vazio para generationType=files.'
                    });
                    return;
                }
            } else {
                if (!audioDir) {
                    res.status(400).json({ error: 'Falta parâmetro obrigatório: audioDir.' });
                    return;
                }
            }

            if (generationSource === 'video' && !videoDir) {
                res.status(400).json({ error: 'Falta parâmetro obrigatório: videoDir.' });
                return;
            }

            if (generationSource === 'image' && !imageDir) {
                res.status(400).json({ error: 'Falta parâmetro obrigatório: imageDir.' });
                return;
            }

            if (generationType !== 'playlist' && generationType !== 'files') {
                res.status(400).json({
                    error: 'Parâmetro generationType inválido: deve ser "playlist" ou "files".'
                });
                return;
            }

            if (generationSource !== 'video' && generationSource !== 'image' && generationSource !== 'auto_image') {
                res.status(400).json({
                    error: 'Parâmetro generationSource inválido: deve ser "video", "image" ou "auto_image".'
                });
                return;
            }

            console.log(`🚀 Iniciando orquestração para tema: ${theme}`);

            let finalImageDir = imageDir;

            if (generationSource === 'auto_image') {
                console.log(`🤖 Usando Gemini para gerar imagem. Gênero detectado/informado: ${musicGenre || 'Nenhum'}`);
                const validGenres = ['lofi', 'soul_worship', 'jazz'];
                const genreToUse = validGenres.includes(musicGenre?.toLowerCase()) ? musicGenre.toLowerCase() : 'lofi';

                const promptService = new PromptGeneratorService();
                const imageService = new GeminiImageGeneratorService();
                const prompt = await promptService.generateDailyPrompt(genreToUse as any);
                finalImageDir = await imageService.generateImage(prompt, genreToUse);
                console.log(`✅ Imagem IA gerada em: ${finalImageDir}`);
            }

            // 2. For 'files' mode: organize individual file paths into a session directory
            //    The services expect a directory — audioDir must contain .mp3 files,
            //    videoDir must contain video_base.mp4
            let finalAudioDir: string = audioDir;
            let finalVideoDir: string = videoDir;

            if (generationType === 'files') {
                const sessionDir = path.resolve(__dirname, '../../temp_uploads', `session_${Date.now()}`);
                fs.mkdirSync(sessionDir, { recursive: true });

                for (const filePath of (audioDirs as string[])) {
                    const basename = path.basename(filePath);
                    // Strip the multer upload prefix (<timestamp>-<random>-)
                    const cleanName = basename.replace(/^\d+-\d+-/, '');
                    fs.copyFileSync(filePath, path.join(sessionDir, cleanName));
                }

                if (generationSource === 'video' && videoDir) {
                    fs.copyFileSync(videoDir as string, path.join(sessionDir, 'video_base.mp4'));
                }

                finalAudioDir = sessionDir;
                finalVideoDir = sessionDir;
                console.log(`📁 Diretório de sessão criado: ${sessionDir}`);
            }

            // 3. Select Generation Service
            let generationResult: any;

            if (generationType === 'playlist') {
                if (generationSource === 'video') {
                    generationResult = await this.playlist_service.generate_with_video({
                        audioDir: finalAudioDir,
                        videoDir: finalVideoDir,
                        outputFileName: outputName
                    });
                } else {
                    generationResult = await this.playlist_service.generate_with_image({
                        audioDir: finalAudioDir,
                        videoDir: finalVideoDir,
                        imageDir: finalImageDir,
                        outputFileName: outputName
                    });
                }
            } else { // generationType === 'files'
                if (generationSource === 'video') {
                    generationResult = await this.by_files_service.generate_with_video({
                        audioDir: finalAudioDir,
                        videoDir: finalVideoDir,
                        outputFileName: outputName
                    });
                } else {
                    generationResult = await this.by_files_service.generate_with_image({
                        audioDir: finalAudioDir,
                        videoDir: finalVideoDir,
                        imageDir: finalImageDir,
                        outputFileName: outputName
                    });
                }
            }

            if (!generationResult || !generationResult.success) {
                throw new Error('A geração do vídeo falhou.');
            }

            console.log(`✅ Vídeo gerado em: ${generationResult.videoPath}`);

            // 3. Automated Upload to YouTube
            // Uses generationResult.videoPath and generationResult.timestampsPath (youtube_chapters.txt)
            const uploadResult = await YtUploadVideoService.uploadWithAutoMetadata(
                generationResult.videoPath,
                generationResult.timestampsPath,
                theme,
                email,
                channelId,
                channelType,
                refreshToken,
                channelLang,
                forceStyle,
                niche,
                musicGenre
            );

            // 4. Return Final Result
            res.status(200).json({
                message: '✅ Geração e Upload concluídos com sucesso!',
                videoPath: generationResult.videoPath,
                videoId: uploadResult.id,
                link: `https://youtube.com/watch?v=${uploadResult.id}`,
                generationDetails: generationResult
            });

        } catch (error: any) {
            console.error('❌ Erro na orquestração:', error);
            res.status(500).json({
                error: 'Falha durante o processo de geração e upload.',
                details: error.message
            });
        }
    }
}
