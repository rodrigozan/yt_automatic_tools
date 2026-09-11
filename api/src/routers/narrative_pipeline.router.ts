import { Router } from 'express';
import { NarrativePipelineController } from '../controllers/narrative_pipeline.controller';

const router = Router();
const controller = new NarrativePipelineController();

/**
 * @swagger
 * /narrative-pipeline/plan:
 *   post:
 *     summary: Calcula o número de capítulos e a faixa de palavras por capítulo para uma duração-alvo
 *     tags: [NarrativePipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetDurationMinutes]
 *             properties:
 *               targetDurationMinutes:
 *                 type: number
 *     responses:
 *       200:
 *         description: Plano calculado (chaptersPlanned, wordsPerChapterTarget)
 *       400:
 *         description: Parâmetro inválido
 */
router.post('/narrative-pipeline/plan', controller.plan);

/**
 * @swagger
 * /narrative-pipeline/runs:
 *   post:
 *     summary: Cria e inicia um novo pipeline de geração de vídeo narrativo longo
 *     tags: [NarrativePipeline]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [genre, period, targetDurationMinutes]
 *             properties:
 *               genre:
 *                 type: string
 *               period:
 *                 type: string
 *               tone:
 *                 type: string
 *               premise:
 *                 type: string
 *               targetDurationMinutes:
 *                 type: number
 *               chaptersPlanned:
 *                 type: number
 *               wordsPerChapterTarget:
 *                 type: object
 *                 properties:
 *                   min:
 *                     type: number
 *                   max:
 *                     type: number
 *               maxRegenerationAttempts:
 *                 type: number
 *     responses:
 *       202:
 *         description: Pipeline iniciado em background
 *       400:
 *         description: Parâmetros obrigatórios ausentes
 *   get:
 *     summary: Lista os pipeline runs
 *     tags: [NarrativePipeline]
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
 *         description: Lista paginada de pipeline runs
 */
router.post('/narrative-pipeline/runs', controller.create);
router.get('/narrative-pipeline/runs', controller.list);

/**
 * @swagger
 * /narrative-pipeline/runs/{id}:
 *   get:
 *     summary: Consulta o status detalhado de um pipeline run
 *     tags: [NarrativePipeline]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status do pipeline run, story bible e capítulos
 *       404:
 *         description: Não encontrado
 */
router.get('/narrative-pipeline/runs/:id', controller.getStatus);

/**
 * @swagger
 * /narrative-pipeline/runs/{id}/resume:
 *   post:
 *     summary: Retoma um pipeline run interrompido a partir da última etapa concluída
 *     tags: [NarrativePipeline]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Pipeline retomado em background
 *       404:
 *         description: Não encontrado
 */
router.post('/narrative-pipeline/runs/:id/resume', controller.resume);

/**
 * @swagger
 * /narrative-pipeline/runs/{id}/retry-rejected-chapters:
 *   post:
 *     summary: Apaga os capítulos em revisao_manual_necessaria e reprocessa apenas eles (reaproveita story bible, capítulos aprovados, narrações e imagens já geradas)
 *     tags: [NarrativePipeline]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Capítulos rejeitados sendo reprocessados em background
 *       200:
 *         description: Não havia capítulos em revisão manual
 *       404:
 *         description: Não encontrado
 */
router.post('/narrative-pipeline/runs/:id/retry-rejected-chapters', controller.retryRejectedChapters);

/**
 * @swagger
 * /narrative-pipeline/runs/{id}/assemble:
 *   post:
 *     summary: Gera uma imagem real (Gemini) para cada prompt visual do run, monta um vídeo por capítulo (slideshow sincronizado com a narração) e concatena tudo no vídeo final
 *     tags: [NarrativePipeline]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vídeo final montado com sucesso
 *       400:
 *         description: Parâmetros obrigatórios ausentes ou narrações ainda não geradas
 *       404:
 *         description: Não encontrado
 */
router.post('/narrative-pipeline/runs/:id/assemble', controller.assemble);

export default router;
