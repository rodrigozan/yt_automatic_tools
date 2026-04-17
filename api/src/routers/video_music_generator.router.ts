import { Router } from "express";
import { VideoGeneratorController } from "../controllers/video_music_generator.controller";
import { PromptGeneratorService } from "../services/prompt_generator.service";
import { GeminiImageGeneratorService } from "../services/gemini_image_generator.service";
import { VideoMusicPlaylistService } from "../services/video_music_playlist_generator.service";
import { VideoMusicByFilesGeneratorService } from "../services/video_music_by_files_generator.service";

const router = Router();

const controller = new VideoGeneratorController();

/**
 * @swagger
 * /video/generate_by_video:
 *   post:
 *     summary: Generate content by video
 *     description: Generates content based on an uploaded video.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - audioDir
 *               - videoDir
 *               - type
 *             properties:
 *               audioDir:
 *                 type: string
 *               videoDir:
 *                 type: string
 *               outputName:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [playlist, files]
 *     responses:
 *       200:
 *         description: Content generated successfully
 */
router.post("/video/generate_by_video", (req, res) => controller.generate_by_video(req, res));

/**
 * @swagger
 * /video/generate_by_image:
 *   post:
 *     summary: Generate content by image
 *     description: Generates content based on an uploaded image.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - audioDir
 *               - imageDir
 *               - type
 *             properties:
 *               audioDir:
 *                 type: string
 *               imageDir:
 *                 type: string
 *               videoDir:
 *                 type: string
 *               outputName:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [playlist, files]
 *     responses:
 *       200:
 *         description: Content generated successfully
 */
router.post("/video/generate_by_image", (req, res) => controller.generate_by_image(req, res));

/**
 * @swagger
 * /video/generate_by_auto_image:
 *   post:
 *     summary: Gera vídeo com imagem criada automaticamente pelo Gemini
 *     description: Gera o prompt, cria a imagem com Gemini e produz o vídeo final em um único endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - genre
 *               - audioDir
 *               - type
 *             properties:
 *               genre:
 *                 type: string
 *                 enum: [lofi, soul_worship, jazz]
 *               audioDir:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [playlist, files]
 *               outputName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Vídeo gerado com sucesso
 */
router.post("/video/generate_by_auto_image", async (req, res) => {
    try {
        const { genre, audioDir, type, outputName } = req.body;

        const validGenres = ['lofi', 'soul_worship', 'jazz'];
        if (!genre || !validGenres.includes(genre)) {
            res.status(400).json({ error: 'Gênero inválido. Use: lofi, soul_worship ou jazz' });
            return;
        }

        if (!audioDir) {
            res.status(400).json({ error: 'Parâmetro obrigatório ausente: audioDir' });
            return;
        }

        if (type !== 'playlist' && type !== 'files') {
            res.status(400).json({ error: 'Parâmetro inválido: type deve ser "playlist" ou "files"' });
            return;
        }

        console.log(`🚀 Iniciando geração automática de vídeo para gênero: ${genre}`);

        const promptService = new PromptGeneratorService();
        const imageService = new GeminiImageGeneratorService();

        const prompt = await promptService.generateDailyPrompt(genre);
        const imagePath = await imageService.generateImage(prompt, genre);

        console.log(`🎬 Imagem pronta, iniciando geração de vídeo...`);

        let result: any;

        if (type === 'playlist') {
            const playlistService = new VideoMusicPlaylistService();
            result = await playlistService.generate_with_image({
                audioDir,
                videoDir: '',
                imageDir: imagePath,
                outputFileName: outputName
            });
        } else {
            const byFilesService = new VideoMusicByFilesGeneratorService();
            result = await byFilesService.generate_with_image({
                audioDir,
                videoDir: '',
                imageDir: imagePath,
                outputFileName: outputName
            });
        }

        const message = {
            message: 'Vídeo gerado com imagem automática!',
            data: {
                genre,
                imagePath,
                ...result
            }
        };

        console.log(`✅ Vídeo com imagem automática gerado para: ${genre}`);
        res.status(200).json(message);

    } catch (error: any) {
        console.error('❌ Erro ao gerar vídeo com imagem automática:', error.message);
        res.status(500).json({
            error: 'Falha ao gerar vídeo com imagem automática',
            details: error.message
        });
    }
});

export default router;