import { Request, Response } from 'express';
import { PromptGeneratorService } from '../services/prompt_generator.service';
import { GeminiImageGeneratorService } from '../services/gemini_image_generator.service';

const VALID_GENRES = ['lofi', 'soul_worship', 'jazz'] as const;
type Genre = typeof VALID_GENRES[number];

export class GeminiImageController {
    private promptGenerator: PromptGeneratorService;
    private imageGenerator: GeminiImageGeneratorService;

    constructor() {
        this.promptGenerator = new PromptGeneratorService();
        this.imageGenerator = new GeminiImageGeneratorService();
    }

    generateDailyImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const { genre } = req.body;

            if (!genre || !VALID_GENRES.includes(genre)) {
                res.status(400).json({
                    success: false,
                    error: 'Gênero inválido. Use: lofi, soul_worship ou jazz'
                });
                return;
            }

            console.log(`📸 Iniciando geração de imagem para: ${genre}`);

            const prompt = await this.promptGenerator.generateDailyPrompt(genre as Genre);
            const imagePath = await this.imageGenerator.generateImage(prompt, genre);

            res.status(200).json({
                success: true,
                message: 'Imagem gerada com sucesso',
                data: {
                    genre,
                    date: new Date().toISOString().split('T')[0],
                    prompt: prompt.substring(0, 200) + '...',
                    imagePath,
                    generationStatus: 'success'
                }
            });

        } catch (error: any) {
            console.error('❌ Erro no controller generateDailyImage:', error.message);
            res.status(500).json({
                success: false,
                error: 'Falha ao gerar imagem',
                details: error.message
            });
        }
    };

    generatePrompt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { genre } = req.body;

            if (!genre || !VALID_GENRES.includes(genre)) {
                res.status(400).json({
                    success: false,
                    error: 'Gênero inválido. Use: lofi, soul_worship ou jazz'
                });
                return;
            }

            const prompt = await this.promptGenerator.generateDailyPrompt(genre as Genre);

            res.status(200).json({
                success: true,
                data: { prompt, genre }
            });

        } catch (error: any) {
            console.error('❌ Erro no controller generatePrompt:', error.message);
            res.status(500).json({
                success: false,
                error: 'Falha ao gerar prompt',
                details: error.message
            });
        }
    };

    listPromptHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { genre, limit } = req.query;

            const history = await this.promptGenerator.listPromptHistory(
                genre as string | undefined,
                limit ? parseInt(limit as string) : 30
            );

            res.status(200).json({
                success: true,
                data: history
            });

        } catch (error: any) {
            console.error('❌ Erro no controller listPromptHistory:', error.message);
            res.status(500).json({
                success: false,
                error: 'Falha ao listar histórico',
                details: error.message
            });
        }
    };
}
