import { Router } from "express";
import { VideoGeneratorController } from "../controllers/video_music_generator.controller";

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
export default router;