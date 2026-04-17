import { Router } from "express";
import { GenerateAndUploadVideosController } from "../controllers/GenerateAndUploadVideosController";

const router = Router();
const controller = new GenerateAndUploadVideosController();

/**
 * @swagger
 * /orchestrator/generate_and_upload:
 *   post:
 *     summary: Gera um vídeo e faz upload automático no YouTube
 *     tags: [Orchestrator]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               audioDir:
 *                 type: string
 *               videoDir:
 *                 type: string
 *               imageDir:
 *                 type: string
 *               outputName:
 *                 type: string
 *               generationType:
 *                 type: string
 *                 enum: [playlist, files]
 *               generationSource:
 *                 type: string
 *                 enum: [video, image, auto_image]
 *               theme:
 *                 type: string
 *               email:
 *                 type: string
 *               channelId:
 *                 type: string
 *               channelType:
 *                 type: string
 *               refreshToken:
 *                 type: string
 *               channelLang:
 *                 type: string
 *               forceStyle:
 *                 type: string
 *                 enum: [christian, secular]
 *     responses:
 *       200:
 *         description: Geração e upload concluídos
 *       500:
 *         description: Erro no processo
 */
router.post("/orchestrator/generate_and_upload", controller.generateAndUpload);

export default router;
