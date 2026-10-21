import { Router } from "express";
import { YtUploadVideoController } from "../controllers/yt_upload_video.controller";
import { requireGladiadorYoutube } from "../middleware/gladiador_yt_auth.middleware";

const router = Router();

const controller = new YtUploadVideoController();

/**
 * @swagger
 * /youtube/upload:
 *   post:
 *     summary: Upload Video to YouTube
 *     description: Uploads a video to YouTube.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoDir
 *               - title
 *               - description
 *               - status
 *             properties:
 *               videoDir:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               channelLang:
 *                 type: string
 *               channelId:
 *                 type: string
 *               channelType:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [private, unlisted, public]
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *                 description: Só com status=private; precisa estar no futuro.
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *       400:
 *         description: status/publishAt inválido (nada é enviado ao YouTube)
 */
router.post("/youtube/upload", requireGladiadorYoutube, (req, res) => controller.upload(req, res));

/**
 * @swagger
 * /youtube/publications:
 *   get:
 *     summary: Lista o registro de publicações (sucesso e erro)
 *     parameters:
 *       - in: query
 *         name: channelId
 *         schema: { type: string }
 *       - in: query
 *         name: result
 *         schema: { type: string, enum: [success, error] }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50, maximum: 200 }
 *     responses:
 *       200:
 *         description: Mais recentes primeiro
 */
router.get("/youtube/publications", requireGladiadorYoutube, (req, res) => controller.listPublications(req, res));

export default router;
