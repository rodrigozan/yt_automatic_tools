import { Types } from 'mongoose';
import { PipelineRunModel, IPipelineRun } from '../models/pipeline_run.model';
import { StoryBibleModel, IStoryBible } from '../models/story_bible.model';
import { ChapterModel } from '../models/chapter.model';
import { StoryBibleGeneratorService } from './story_bible_generator.service';
import { ChapterGeneratorService, IPriorSummary } from './chapter_generator.service';
import { ContinuityCheckerService } from './continuity_checker.service';
import { ChapterSummarizerService } from './chapter_summarizer.service';
import { VisualPromptGeneratorService } from './visual_prompt_generator.service';
import { NarrationGeneratorService } from './narration_generator.service';
import { NarrativeMetadataGeneratorService } from './narrative_metadata_generator.service';
import { OpenRouterService } from './openrouter.service';

export class NarrativePipelineOrchestratorService {
    private storyBibleGenerator = new StoryBibleGeneratorService();
    private chapterGenerator = new ChapterGeneratorService();
    private continuityChecker = new ContinuityCheckerService();
    private chapterSummarizer = new ChapterSummarizerService();
    private visualPromptGenerator = new VisualPromptGeneratorService();
    private narrationGenerator = new NarrationGeneratorService();
    private metadataGenerator = new NarrativeMetadataGeneratorService();
    private openRouter = new OpenRouterService();

    public async run(pipelineRunId: Types.ObjectId): Promise<void> {
        const run = await PipelineRunModel.findById(pipelineRunId);
        if (!run) throw new Error('Pipeline run não encontrado');

        try {
            const storyBible = await this.ensureStoryBible(run);

            run.status = 'writing';
            run.current_step = 'gerando_capitulos';
            await run.save();

            for (let chapterNumber = 1; chapterNumber <= run.chapters_planned; chapterNumber++) {
                await this.processChapter(run, storyBible, chapterNumber);
            }

            const approvedChaptersCount = await ChapterModel.countDocuments({
                pipeline_run_id: run._id,
                status: 'approved',
            });

            if (approvedChaptersCount < run.chapters_planned) {
                const rejectedCount = run.chapters_planned - approvedChaptersCount;
                run.status = 'aguardando_revisao_manual';
                run.current_step = `aguardando_revisao_manual_de_${rejectedCount}_capitulo(s)`;
                await run.save();
                return;
            }

            run.status = 'visual_prompts';
            run.current_step = 'gerando_prompts_visuais';
            await run.save();

            const { visualPrompts, promptTokens, completionTokens } =
                await this.visualPromptGenerator.generateForRun(run._id!, storyBible, run.visual_prompts);

            run.visual_prompts = visualPrompts;
            if (promptTokens || completionTokens) {
                this.logCost(run, 'prompts_visuais', this.visualPromptGenerator.model, promptTokens, completionTokens);
            }
            await run.save();

            run.status = 'narration';
            run.current_step = 'gerando_narracao';
            await run.save();

            run.narration_files = await this.narrationGenerator.generateForRun(run._id!, run.narration_files);
            await run.save();

            run.status = 'metadata';
            run.current_step = 'gerando_metadados';
            await run.save();

            if (!run.metadata) {
                const { metadata, promptTokens, completionTokens } =
                    await this.metadataGenerator.generate(run._id!, storyBible);

                run.metadata = metadata;
                this.logCost(run, 'metadados', this.metadataGenerator.model, promptTokens, completionTokens);
                await run.save();
            }

            run.status = 'video_assembly';
            run.current_step = run.final_video_path
                ? 'concluido'
                : 'aguardando_chamada_manual_de_montagem';
            await run.save();

            if (run.final_video_path) {
                run.status = 'completed';
                await run.save();
            }
        } catch (error: any) {
            run.status = 'failed';
            run.error_message = error.message;
            await run.save();
            throw error;
        }
    }

    private async ensureStoryBible(run: any): Promise<IStoryBible> {
        let storyBible = await StoryBibleModel.findOne({ pipeline_run_id: run._id });

        if (storyBible) return storyBible.toObject();

        run.status = 'planning';
        run.current_step = 'gerando_story_bible';
        await run.save();

        const result = await this.storyBibleGenerator.generate(run._id, run.briefing, run.chapters_planned);
        this.logCost(run, 'story_bible', this.storyBibleGenerator.model, result.promptTokens, result.completionTokens);
        await run.save();

        return result.storyBible;
    }

    private async processChapter(run: any, storyBible: IStoryBible, chapterNumber: number): Promise<void> {
        let chapter = await ChapterModel.findOne({ pipeline_run_id: run._id, chapter_number: chapterNumber });

        if (chapter && (chapter.status === 'approved' || chapter.status === 'revisao_manual_necessaria')) {
            return;
        }

        const approvedPriorChapters = await ChapterModel.find({
            pipeline_run_id: run._id,
            chapter_number: { $lt: chapterNumber },
            status: 'approved',
        }).sort({ chapter_number: 1 });

        const priorSummaries: IPriorSummary[] = approvedPriorChapters.map((c) => ({
            chapter_number: c.chapter_number,
            summary: c.summary,
        }));

        const previousChapter = approvedPriorChapters.find((c) => c.chapter_number === chapterNumber - 1);

        const outlineItem = storyBible.outline.find((o) => o.chapter_number === chapterNumber);
        if (!outlineItem) throw new Error(`Outline não encontrado para o capítulo ${chapterNumber}`);

        const maxAttempts = run.max_regeneration_attempts ?? 5;
        let attempt = chapter?.continuity_checks?.length ?? 0;
        let correctionNotes: string[] = [];

        while (true) {
            const genResult = await this.chapterGenerator.generate({
                pipelineRunId: run._id,
                storyBible,
                chapterNumber,
                outlineSummary: outlineItem.summary_planned,
                priorSummaries,
                previousChapterText: previousChapter?.text,
                wordsPerChapterTarget: run.words_per_chapter_target,
                correctionNotes,
            });

            this.logCost(run, `capitulo_${chapterNumber}`, this.chapterGenerator.model, genResult.promptTokens, genResult.completionTokens);
            await run.save();

            chapter = genResult.chapter;

            if (chapterNumber === 1) {
                chapter.status = 'approved';
                await chapter.save();
                break;
            }

            const checkResult = await this.continuityChecker.check({
                storyBible,
                priorSummaries,
                chapterNumber,
                chapterText: chapter.text,
                outlineSummary: outlineItem.summary_planned,
            });

            this.logCost(run, `continuidade_capitulo_${chapterNumber}`, this.continuityChecker.model, checkResult.promptTokens, checkResult.completionTokens);
            await run.save();

            attempt += 1;
            chapter.continuity_checks.push({ attempt, issues: checkResult.issues, checked_at: new Date() });

            const blockingIssues = checkResult.issues.filter((issue) => issue.severity === 'bloqueante');

            if (blockingIssues.length === 0) {
                chapter.status = 'approved';
                await chapter.save();
                break;
            }

            if (attempt >= maxAttempts) {
                chapter.status = 'revisao_manual_necessaria';
                await chapter.save();
                break;
            }

            correctionNotes = blockingIssues.map((issue) => issue.description);
            await chapter.save();
        }

        if (chapter.status === 'approved') {
            const summaryResult = await this.chapterSummarizer.summarize(chapter.text);
            chapter.summary = summaryResult.summary;
            await chapter.save();

            this.logCost(run, `resumo_capitulo_${chapterNumber}`, this.chapterSummarizer.model, summaryResult.promptTokens, summaryResult.completionTokens);
            await run.save();
        }
    }

    private logCost(run: IPipelineRun, step: string, model: string, promptTokens: number, completionTokens: number): void {
        const estimatedCost = this.openRouter.estimateChatCost(model, promptTokens, completionTokens);

        run.cost_log.push({
            step,
            model,
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            estimated_cost_usd: estimatedCost,
            created_at: new Date(),
        });

        run.total_estimated_cost_usd = (run.total_estimated_cost_usd || 0) + estimatedCost;
    }
}
