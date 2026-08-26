import { Router } from "express";
import { SocialPublisherController } from "../controllers/social_publisher.controller";

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
 *                 enum: [video, image, text]
 *               isShortForm:
 *                 type: boolean
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
router.post("/publisher/publish", SocialPublisherController.publish);

export default router;
