import { Router } from "express";
import { YtUploadVideoController } from "../controllers/yt_upload_video.controller";

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
 *               refreshToken:
 *                 type: string
 *               channelLang:
 *                 type: string
 *               publishAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 */
router.post("/youtube/upload", (req, res) => controller.upload(req, res));

export default router;