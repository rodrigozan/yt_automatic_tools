import { Request, Response } from 'express'; // Ajuste conforme seu framework
import { VideoMusicByFilesGeneratorService } from '../services/video_music_by_files_generator.service';
import { VideoMusicPlaylistService } from '../services/video_music_playlist_generator.service';

export class VideoGeneratorController {
    private playlist_service: VideoMusicPlaylistService;
    private by_files_service: VideoMusicByFilesGeneratorService;

    constructor() {
        this.playlist_service = new VideoMusicPlaylistService();
        this.by_files_service = new VideoMusicByFilesGeneratorService();
    }

    // Método que será chamado pela rota POST
    public generate_by_video = async (req: Request, res: Response): Promise<void> => {
        try {
            // 1. Recebe os parâmetros do POST
            const { audioDir, videoDir, outputName, type } = req.body;

            // 2. Validação simples de entrada
            if (!audioDir || !videoDir) {
                res.status(400).json({
                    error: 'Parâmetros obrigatórios: audioDir e videoDir são necessários.'
                });
                return;
            }

            console.log(`Iniciando geração para: ${audioDir}`);

            if (type !== 'playlist' && type !== 'files') {
                res.status(400).json({
                    error: 'Parâmetro inválido: type deve ser "playlist" ou "files".'
                });
                return;
            }

            let result: any;

            if (type === 'playlist') {

                console.log('Usando método de playlist.');

                // 3.1 Chama o serviço de playlist
                result = await this.playlist_service.generate_with_video({
                    audioDir,
                    videoDir,
                    outputFileName: outputName // opcional
                });

            } else if (type === 'files') {

                console.log('Usando método de arquivos.');

                // 3.2 Chama o serviço de files
                result = await this.by_files_service.generate_with_video({
                    audioDir,
                    videoDir,
                    outputFileName: outputName
                });

            }

            const message = {
                message: 'Vídeo gerado com sucesso!',
                data: result
            }

            console.log(message);

            // 4. Retorna sucesso
            res.status(200).json(message);

        } catch (error: any) {
            console.error('Erro no controller de vídeo:', error);
            res.status(500).json({
                error: 'Falha ao gerar o vídeo.',
                details: error.message
            });
        }
    }

    public generate_by_image = async (req: Request, res: Response): Promise<void> => {
        try {
            // 1. Recebe os parâmetros do POST
            const { audioDir, videoDir, imageDir, outputName, type } = req.body;

            // 2. Validação simples de entrada
            if (!audioDir || !imageDir) {
                res.status(400).json({
                    error: 'Parâmetros obrigatórios: audioDir e imageDir são necessários.'
                });
                return;
            }

            console.log(`Iniciando geração para: ${audioDir}`);

            if (type !== 'playlist' && type !== 'files') {
                res.status(400).json({
                    error: 'Parâmetro inválido: type deve ser "playlist" ou "files".'
                });
                return;
            }

            let result: any;

            if (type === 'playlist') {

                console.log('Usando método de playlist.');

                // 3.1 Chama o serviço de playlist
                result = await this.playlist_service.generate_with_image({
                    audioDir,
                    imageDir,
                    videoDir,
                    outputFileName: outputName // opcional
                });

            } else if (type === 'files') {

                console.log('Usando método de arquivos.');

                // 3.2 Chama o serviço de files
                result = await this.by_files_service.generate_with_image({
                    audioDir,
                    imageDir,
                    videoDir,
                    outputFileName: outputName
                });

            }

            const message = {
                message: 'Vídeo gerado com sucesso!',
                data: result
            }

            console.log(message);

            // 4. Retorna sucesso
            res.status(200).json(message);

        } catch (error: any) {
            console.error('Erro no controller de vídeo:', error);
            res.status(500).json({
                error: 'Falha ao gerar o vídeo.',
                details: error.message
            });
        }
    }
}