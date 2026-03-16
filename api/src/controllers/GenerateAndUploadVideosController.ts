import { Request, Response } from 'express';
import { VideoMusicByFilesGeneratorService } from '../services/video_music_by_files_generator.service';
import { VideoMusicPlaylistService } from '../services/video_music_playlist_generator.service';
import { YtUploadVideoService } from '../services/yt_upload_video.service';

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
                videoDir,
                imageDir,
                outputName,
                generationType, // 'playlist' | 'files'
                generationSource, // 'video' | 'image'

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
            if (!audioDir || !videoDir || !theme || !email || !channelId || !channelType) {
                res.status(400).json({
                    error: 'Faltam parâmetros obrigatórios para geração e upload.'
                });
                return;
            }

            if (generationType !== 'playlist' && generationType !== 'files') {
                res.status(400).json({
                    error: 'Parâmetro generationType inválido: deve ser "playlist" ou "files".'
                });
                return;
            }

            if (generationSource !== 'video' && generationSource !== 'image') {
                res.status(400).json({
                    error: 'Parâmetro generationSource inválido: deve ser "video" ou "image".'
                });
                return;
            }

            console.log(`🚀 Iniciando orquestração para tema: ${theme}`);

            // 2. Select Generation Service
            let generationResult: any;

            if (generationType === 'playlist') {
                if (generationSource === 'video') {
                    generationResult = await this.playlist_service.generate_with_video({
                        audioDir,
                        videoDir,
                        outputFileName: outputName
                    });
                } else {
                    generationResult = await this.playlist_service.generate_with_image({
                        audioDir,
                        videoDir,
                        imageDir,
                        outputFileName: outputName
                    });
                }
            } else { // generationType === 'files'
                if (generationSource === 'video') {
                    generationResult = await this.by_files_service.generate_with_video({
                        audioDir,
                        videoDir,
                        outputFileName: outputName
                    });
                } else {
                    generationResult = await this.by_files_service.generate_with_image({
                        audioDir,
                        videoDir,
                        imageDir,
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
