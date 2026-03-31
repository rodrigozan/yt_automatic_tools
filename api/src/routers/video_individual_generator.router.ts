import { Router } from 'express';
import { VideoIndividualGeneratorController } from '../controllers/video_individual_generator.controller';

const router = Router();
const controller = new VideoIndividualGeneratorController();

/**
 * @swagger
 * /video/generate_individual:
 *   post:
 *     summary: Gera vídeos individuais (imagem + música) com efeitos via FFmpeg
 *     description: >
 *       Para cada imagem numerada (01.jpeg, 02.jpeg … 06.jpeg) encontrada em `sourceDir`,
 *       localiza o mp3 de mesmo prefixo numérico (ex: "01 - Aleluia.mp3") e gera um
 *       vídeo `.mp4` individual com efeitos de partículas e luzes sobrepostos via FFmpeg.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceDir
 *             properties:
 *               sourceDir:
 *                 type: string
 *                 description: Caminho absoluto da pasta contendo imagens e mp3s
 *                 example: "D:/YT Channels/R&B Lofi/images"
 *               outputDir:
 *                 type: string
 *                 description: Pasta de saída dos vídeos (opcional; padrão = sourceDir)
 *                 example: "D:/YT Channels/R&B Lofi/videos"
 *     responses:
 *       200:
 *         description: Vídeos gerados com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     generated:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           imageName:
 *                             type: string
 *                           audioName:
 *                             type: string
 *                           videoPath:
 *                             type: string
 *                           duration:
 *                             type: string
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Parâmetros inválidos
 *       500:
 *         description: Erro interno ao gerar vídeos
 */
router.post('/video/generate_individual', (req, res) => controller.generate_individual(req, res));

export default router;
