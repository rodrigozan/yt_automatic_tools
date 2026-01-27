import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { VideoStoryGeneratorService } from '../services/video_story_generator.service';

export class VideoStoryGeneratorController {
    private service: VideoStoryGeneratorService;

    constructor() {
        this.service = new VideoStoryGeneratorService();
    }

    // Usando arrow function para manter o contexto do 'this' sem precisar de bind na rota
    public handleRender = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { targetPath, musicPath } = req.body;

            if (!targetPath || !musicPath) {
                return res.status(400).json({
                    error: 'Parâmetros obrigatórios: targetPath e musicPath.'
                });
            }

            // Normalização de diretório (Aceita arquivo ou pasta)
            let workDir = path.resolve(targetPath);
            if (fs.existsSync(workDir) && fs.lstatSync(workDir).isFile()) {
                workDir = path.dirname(workDir);
            }

            const absoluteMusicPath = path.resolve(musicPath);

            // Validações de File System
            if (!fs.existsSync(workDir)) {
                return res.status(404).json({ error: `Diretório não encontrado: ${workDir}` });
            }
            if (!fs.existsSync(absoluteMusicPath)) {
                return res.status(404).json({ error: `Arquivo de música não encontrado: ${absoluteMusicPath}` });
            }

            // Chamada ao Service
            await this.service.executeProcess(workDir, absoluteMusicPath);

            return res.status(200).json({
                success: true,
                message: 'Vídeo renderizado e áudio mixado.',
                outputFile: path.join(workDir, 'output_final_com_musica.mp4')
            });

        } catch (error: any) {
            console.error('Erro no controller:', error);
            return res.status(500).json({
                error: error.message || 'Erro interno ao processar vídeo.'
            });
        }
    }
}