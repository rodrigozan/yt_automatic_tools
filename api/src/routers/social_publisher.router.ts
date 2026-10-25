import { Router } from "express";
import { SocialPublisherController } from "../controllers/social_publisher.controller";
import { requireGladiadorYoutube } from "../middleware/gladiador_yt_auth.middleware";

const router = Router();

/**
 * @swagger
 * /publisher/publish:
 *   post:
 *     summary: Publica conteúdo (vídeo, imagem ou texto) em uma ou mais plataformas (YouTube, Facebook, Instagram)
 *     tags: [Publisher]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               channelId:
 *                 type: string
 *               channelType:
 *                 type: string
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [youtube, facebook, instagram]
 *               contentType:
 *                 type: string
 *                 enum: [video, image, text, carousel]
 *               isShortForm:
 *                 type: boolean
 *               mediaPaths:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Carrossel (contentType carousel) - de 2 a 10 imagens locais; só Facebook.
 *               scheduledAt:
 *                 type: string
 *                 description: ISO 8601; agenda no Facebook (de 10 minutos a 30 dias à frente).
 *               mediaPath:
 *                 type: string
 *               caption:
 *                 type: string
 *               theme:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado por plataforma
 *       500:
 *         description: Erro ao publicar
 */
router.post("/publisher/publish", requireGladiadorYoutube, SocialPublisherController.publish);

export default router;
