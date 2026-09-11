import { Request, Response } from 'express';
import { PipelineRunModel } from '../models/pipeline_run.model';
import { StoryBibleModel } from '../models/story_bible.model';
import { ChapterModel } from '../models/chapter.model';
import { StoryBibleGeneratorService } from '../services/story_bible_generator.service';
import { NarrativePipelineOrchestratorService } from '../services/narrative_pipeline_orchestrator.service';
import { NarrativeImageGeneratorService } from '../services/narrative_image_generator.service';
import { NarrativeVideoAssemblerService } from '../services/narrative_video_assembler.service';

export class NarrativePipelineController {
    private storyBibleGenerator: StoryBibleGeneratorService;
    private orchestrator: NarrativePipelineOrchestratorService;
    private narrativeImageGenerator: NarrativeImageGeneratorService;
    private narrativeVideoAssembler: NarrativeVideoAssemblerService;

    constructor() {
        this.storyBibleGenerator = new StoryBibleGeneratorService();
        this.orchestrator = new NarrativePipelineOrchestratorService();
        this.narrativeImageGenerator = new NarrativeImageGeneratorService();
        this.narrativeVideoAssembler = new NarrativeVideoAssemblerService();
    }

    public plan = (req: Request, res: Response): void => {
        const { targetDurationMinutes } = req.body;

        if (!targetDurationMinutes || targetDurationMinutes <= 0) {
            res.status(400).json({ error: 'targetDurationMinutes é obrigatório e deve ser maior que zero' });
            return;
        }

        const plan = this.storyBibleGenerator.calculateChapterPlan(Number(targetDurationMinutes));
        res.status(200).json({ data: plan });
    };

    public create = async (req: Request, res: Response): Promise<void> => {
        const { genre, period, tone, premise, targetDurationMinutes, chaptersPlanned, wordsPerChapterTarget, maxRegenerationAttempts } = req.body;

        if (!genre || !period || !targetDurationMinutes) {
            res.status(400).json({ error: 'genre, period e targetDurationMinutes são obrigatórios' });
            return;
        }

        try {
            const defaultPlan = this.storyBibleGenerator.calculateChapterPlan(Number(targetDurationMinutes));

            const run = await PipelineRunModel.create({
                briefing: { genre, period, tone, premise },
                target_duration_minutes: targetDurationMinutes,
                chapters_planned: chaptersPlanned ?? defaultPlan.chaptersPlanned,
                words_per_chapter_target: wordsPerChapterTarget ?? defaultPlan.wordsPerChapterTarget,
                max_regeneration_attempts: maxRegenerationAttempts ?? 5,
                status: 'planning',
                current_step: 'aguardando_inicio',
            });

            this.orchestrator.run(run._id!).catch((err: any) =>
                console.error(`[NarrativePipeline] Falha no pipeline ${run._id}:`, err.message)
            );

            res.status(202).json({ message: 'Pipeline iniciado', data: run });
        } catch (err: any) {
            console.error('[NarrativePipelineController] create error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    public retryRejectedChapters = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            const run = await PipelineRunModel.findById(id);

            if (!run) {
                res.status(404).json({ error: 'Pipeline run não encontrado' });
                return;
            }

            const { deletedCount } = await ChapterModel.deleteMany({
                pipeline_run_id: run._id,
                status: 'revisao_manual_necessaria',
            });

            if (!deletedCount) {
                res.status(200).json({ message: 'Nenhum capítulo em revisão manual para reprocessar', data: run });
                return;
            }

            run.status = 'writing';
            run.error_message = undefined;
            run.final_video_path = null;
            await run.save();

            this.orchestrator.run(run._id!).catch((err: any) =>
                console.error(`[NarrativePipeline] Falha ao reprocessar capítulos rejeitados ${run._id}:`, err.message)
            );

            res.status(202).json({ message: `${deletedCount} capítulo(s) rejeitado(s) sendo reprocessado(s)`, data: run });
        } catch (err: any) {
            console.error('[NarrativePipelineController] retryRejectedChapters error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    public resume = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            const run = await PipelineRunModel.findById(id);

            if (!run) {
                res.status(404).json({ error: 'Pipeline run não encontrado' });
                return;
            }

            if (run.status === 'completed') {
                res.status(200).json({ message: 'Pipeline já concluído', data: run });
                return;
            }

            run.status = run.status === 'failed' ? 'planning' : run.status;
            run.error_message = undefined;
            await run.save();

            this.orchestrator.run(run._id!).catch((err: any) =>
                console.error(`[NarrativePipeline] Falha ao retomar pipeline ${run._id}:`, err.message)
            );

            res.status(202).json({ message: 'Pipeline retomado', data: run });
        } catch (err: any) {
            console.error('[NarrativePipelineController] resume error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    public assemble = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            const run = await PipelineRunModel.findById(id);

            if (!run) {
                res.status(404).json({ error: 'Pipeline run não encontrado' });
                return;
            }

            if (!run.narration_files.length) {
                res.status(400).json({ error: 'Pipeline ainda não gerou os arquivos de narração' });
                return;
            }

            if (!run.visual_prompts.length) {
                res.status(400).json({ error: 'Pipeline ainda não gerou os prompts visuais' });
                return;
            }

            run.visual_prompts = await this.narrativeImageGenerator.generateForRun(run._id!, run.visual_prompts);
            await run.save();

            const finalVideoPath = await this.narrativeVideoAssembler.assemble(
                String(run._id),
                run.narration_files,
                run.visual_prompts
            );

            run.final_video_path = finalVideoPath;
            run.status = 'completed';
            run.current_step = 'concluido';
            await run.save();

            res.status(200).json({ message: 'Vídeo montado com sucesso', data: run });
        } catch (err: any) {
            console.error('[NarrativePipelineController] assemble error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    public getStatus = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            const run = await PipelineRunModel.findById(id);

            if (!run) {
                res.status(404).json({ error: 'Pipeline run não encontrado' });
                return;
            }

            const storyBible = await StoryBibleModel.findOne({ pipeline_run_id: run._id });
            const chapters = await ChapterModel.find({ pipeline_run_id: run._id })
                .sort({ chapter_number: 1 })
                .select('chapter_number word_count status summary continuity_checks');

            res.status(200).json({ data: { run, storyBible, chapters } });
        } catch (err: any) {
            console.error('[NarrativePipelineController] getStatus error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    public list = async (req: Request, res: Response): Promise<void> => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        try {
            const [runs, total] = await Promise.all([
                PipelineRunModel.find()
                    .sort({ created_at: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit),
                PipelineRunModel.countDocuments(),
            ]);

            res.status(200).json({ data: runs, page, limit, total });
        } catch (err: any) {
            console.error('[NarrativePipelineController] list error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };
}
