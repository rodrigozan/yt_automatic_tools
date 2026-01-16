import { Router } from "express";
import { SunoController } from "../controllers/suno.controller";

const router = Router();
const controller = new SunoController();

/**
 * @swagger
 * /suno/generate:
 *   post:
 *     summary: Generate Music with Suno
 *     description: Generates music using Suno AI.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "A futuristic synthwave track with heavy bass"
 *     responses:
 *       200:
 *         description: Music generated successfully
 */
router.post("/suno/generate", (req, res) => controller.generate(req, res));

export default router; 
