import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { YtUploadVideoController } from "../controllers/yt_upload_video.controller";
import { YtCommentsController } from "../controllers/yt_comments.controller";
import { requireGladiadorYoutube } from "../middleware/gladiador_yt_auth.middleware";

const router = Router();

const thumbUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } }).single("file");
const receiveThumbnail = (req: Request, res: Response, next: NextFunction) =>
  thumbUpload(req, res, (err: any) => {
    if (!err) return next();
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    return res.status(tooBig ? 413 : 400).json({ error: tooBig ? "A thumbnail passa de 2 MB." : err.message });
  });

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

/**
 * @swagger
 * /youtube/comments:
 *   get:
 *     summary: List comments on a channel's videos
 *     parameters:
 *       - in: query
 *         name: channelId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: maxResults
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 50 }
 *       - in: query
 *         name: pageToken
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comments ordered by newest first, with a token for the next page
 *       400:
 *         description: Invalid query parameters
 */
router.get("/youtube/comments", requireGladiadorYoutube, (req, res) => YtCommentsController.list(req, res));

/**
 * @swagger
 * /youtube/comments/reply:
 *   post:
 *     summary: Reply to a YouTube comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [channelId, parentId, text]
 *             properties:
 *               channelId: { type: string }
 *               parentId: { type: string, description: ID of the comment thread or comment being replied to }
 *               text: { type: string, maxLength: 10000 }
 *     responses:
 *       201:
 *         description: Reply created successfully
 *       400:
 *         description: Invalid request body
 */
router.post("/youtube/comments/reply", requireGladiadorYoutube, (req, res) => YtCommentsController.reply(req, res));

/**
 * @swagger
 * /youtube/videos/{videoId}/visibility:
 *   patch:
 *     summary: Muda a visibilidade de um vídeo já enviado
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [channelId, status]
 *             properties:
 *               channelId: { type: string }
 *               status: { type: string, enum: [private, unlisted, public] }
 *     responses:
 *       200:
 *         description: "{ videoId, previous, status, changed }"
 *       403:
 *         description: Vídeo de outro canal ou canal não autorizado
 *       404:
 *         description: Vídeo ou canal não encontrado
 */
router.patch("/youtube/videos/:videoId/visibility", requireGladiadorYoutube, (req, res) => controller.setVisibility(req, res));

/**
 * @swagger
 * /youtube/videos/{videoId}/thumbnail:
 *   put:
 *     summary: Define a thumbnail de um vídeo já enviado
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: channelId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file: { type: string, format: binary, description: PNG ou JPG de até 2 MB }
 *     responses:
 *       200:
 *         description: "{ videoId, bytes, mimeType, thumbnailUrl }"
 *       400:
 *         description: Arquivo ausente, formato inválido ou recusado pelo YouTube
 *       403:
 *         description: Vídeo de outro canal ou canal sem permissão de thumbnail
 *       413:
 *         description: Arquivo maior que 2 MB
 */
router.put("/youtube/videos/:videoId/thumbnail", requireGladiadorYoutube, receiveThumbnail, (req, res) => controller.setThumbnail(req, res));

/** Atualiza title/description/tags; channelId no JSON. Retorna leitura posterior e verificação do agendamento. */
router.patch("/youtube/videos/:videoId/snippet", requireGladiadorYoutube, (req, res) => controller.updateSnippet(req, res));

export default router;
