import { Router } from 'express';
import { SunoController } from '../controllers/suno.controller';

const router = Router();
const controller = new SunoController();

/**
 * @swagger
 * /suno/generate:
 *   post:
 *     summary: Generate music
 *     description: >
 *       Generates music using Suno AI as primary provider.
 *       Falls back to Replicate (MusicGen by Meta) if Suno is unavailable.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 example: "Calm lofi hip-hop with rain sounds"
 *               instrumental:
 *                 type: boolean
 *                 default: true
 *                 description: Generate without vocals
 *               durationSeconds:
 *                 type: integer
 *                 default: 30
 *                 description: Duration in seconds (used by Replicate fallback)
 *     responses:
 *       202:
 *         description: Generation started — poll /suno/status/:id for updates
 *       400:
 *         description: Missing prompt
 *       500:
 *         description: No provider configured or generation failed
 */
router.post('/suno/generate', (req, res) => controller.generate(req, res));

/**
 * @swagger
 * /suno/status/{id}:
 *   get:
 *     summary: Get music generation status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The sunoId returned by /suno/generate
 *     responses:
 *       200:
 *         description: Music record with current status
 *       404:
 *         description: Not found
 */
router.get('/suno/status/:id', (req, res) => controller.getStatus(req, res));

/**
 * @swagger
 * /suno/list:
 *   get:
 *     summary: List all generated music tracks
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of music records
 */
router.get('/suno/list', (req, res) => controller.list(req, res));

/**
 * @swagger
 * /suno/{id}:
 *   delete:
 *     summary: Delete a music record
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete('/suno/:id', (req, res) => controller.deleteMusic(req, res));

/**
 * @swagger
 * /suno/providers:
 *   get:
 *     summary: List available music generation providers
 *     responses:
 *       200:
 *         description: List of configured providers
 */
router.get('/suno/providers', (req, res) => controller.providers(req, res));

export default router;
