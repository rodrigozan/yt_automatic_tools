import { Router } from 'express';
import { GeminiImageController } from '../controllers/gemini_image.controller';

const router = Router();
const controller = new GeminiImageController();

/**
 * @swagger
 * /gemini/generate-daily-image:
 *   post:
 *     summary: Gera imagem diária com Gemini para o gênero informado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - genre
 *             properties:
 *               genre:
 *                 type: string
 *                 enum: [lofi, soul_worship, jazz]
 *     responses:
 *       200:
 *         description: Imagem gerada com sucesso
 */
router.post('/gemini/generate-daily-image', (req, res) => controller.generateDailyImage(req, res));

/**
 * @swagger
 * /gemini/generate-prompt:
 *   post:
 *     summary: Gera apenas o prompt para o gênero informado (útil para testes)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - genre
 *             properties:
 *               genre:
 *                 type: string
 *                 enum: [lofi, soul_worship, jazz]
 *     responses:
 *       200:
 *         description: Prompt gerado com sucesso
 */
router.post('/gemini/generate-prompt', (req, res) => controller.generatePrompt(req, res));

/**
 * @swagger
 * /gemini/prompts-history:
 *   get:
 *     summary: Lista o histórico de prompts gerados
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *           enum: [lofi, soul_worship, jazz]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Histórico retornado com sucesso
 */
router.get('/gemini/prompts-history', (req, res) => controller.listPromptHistory(req, res));

export default router;
