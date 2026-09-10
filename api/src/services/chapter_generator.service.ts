import { Types, HydratedDocument } from 'mongoose';
import { OpenRouterService } from './openrouter.service';
import { ChapterModel, IChapter } from '../models/chapter.model';
import { IStoryBible } from '../models/story_bible.model';

const MAX_LENGTH_RETRIES = 2;
const LENGTH_TOLERANCE = 0.15;

export interface IPriorSummary {
    chapter_number: number;
    summary: string;
}

export interface IGenerateChapterParams {
    pipelineRunId: Types.ObjectId;
    storyBible: IStoryBible;
    chapterNumber: number;
    outlineSummary: string;
    priorSummaries: IPriorSummary[];
    previousChapterText?: string;
    wordsPerChapterTarget: { min: number; max: number };
    correctionNotes?: string[];
}

function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
}

export class ChapterGeneratorService {
    private openRouter: OpenRouterService;
    public readonly model: string;

    constructor() {
        this.openRouter = new OpenRouterService();
        this.model = process.env.OPENROUTER_MODEL_WRITING || 'openai/gpt-4o-mini';
    }

    private buildSystemPrompt(storyBible: IStoryBible, wordsPerChapterTarget: { min: number; max: number }): string {
        return `Você é um roteirista especialista em dramas de época e romance para narração longa em português do Brasil.
Escreva o texto do capítulo solicitado, em prosa narrativa contínua, pronto para narração em áudio.
A story bible completa desta história é:
${JSON.stringify(storyBible)}

Regras obrigatórias:
- O capítulo deve ter entre ${wordsPerChapterTarget.min} e ${wordsPerChapterTarget.max} palavras.
- Respeite rigorosamente idade, aparência e personalidade dos personagens definidos na story bible.
- Não revele segredos de personagens antes do momento apropriado da trama.
- Mantenha o tom e o ritmo definidos na story bible.
- Responda APENAS com o texto do capítulo, sem título, sem markdown, sem comentários.`;
    }

    private buildUserPrompt(params: IGenerateChapterParams): string {
        const summariesText = params.priorSummaries.length
            ? params.priorSummaries.map((s) => `Capítulo ${s.chapter_number}: ${s.summary}`).join('\n')
            : 'Nenhum capítulo anterior — este é o primeiro capítulo.';

        const previousChapterBlock = params.previousChapterText
            ? `\n\nTexto completo do capítulo imediatamente anterior (para continuidade de tom e fala):\n${params.previousChapterText}`
            : '';

        const correctionBlock = params.correctionNotes?.length
            ? `\n\nATENÇÃO — problemas encontrados na tentativa anterior que devem ser corrigidos nesta nova versão:\n${params.correctionNotes.map((n) => `- ${n}`).join('\n')}`
            : '';

        return `Resumo dos capítulos anteriores:
${summariesText}${previousChapterBlock}

Outline planejado para o capítulo ${params.chapterNumber}:
${params.outlineSummary}${correctionBlock}`;
    }

    public async generate(params: IGenerateChapterParams): Promise<{
        chapter: HydratedDocument<IChapter>;
        promptTokens: number;
        completionTokens: number;
    }> {
        const systemPrompt = this.buildSystemPrompt(params.storyBible, params.wordsPerChapterTarget);
        const target = (params.wordsPerChapterTarget.min + params.wordsPerChapterTarget.max) / 2;
        const minAcceptable = target * (1 - LENGTH_TOLERANCE);
        const maxAcceptable = target * (1 + LENGTH_TOLERANCE);

        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;
        let text = '';
        let wordCount = 0;
        let correctionNotes = params.correctionNotes ?? [];

        for (let attempt = 0; attempt <= MAX_LENGTH_RETRIES; attempt++) {
            const userPrompt = this.buildUserPrompt({ ...params, correctionNotes });

            const result = await this.openRouter.chatCompletion({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.85,
            });

            totalPromptTokens += result.promptTokens;
            totalCompletionTokens += result.completionTokens;
            text = result.content.trim();
            wordCount = countWords(text);

            if (wordCount >= minAcceptable && wordCount <= maxAcceptable) break;

            correctionNotes = [
                `O texto gerado tinha ${wordCount} palavras, fora da faixa ${params.wordsPerChapterTarget.min}-${params.wordsPerChapterTarget.max}. Reescreva ajustando o tamanho para dentro dessa faixa.`,
            ];
        }

        const chapter = await ChapterModel.findOneAndUpdate(
            { pipeline_run_id: params.pipelineRunId, chapter_number: params.chapterNumber },
            {
                pipeline_run_id: params.pipelineRunId,
                chapter_number: params.chapterNumber,
                text,
                word_count: wordCount,
                status: 'draft',
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return {
            chapter: chapter!,
            promptTokens: totalPromptTokens,
            completionTokens: totalCompletionTokens,
        };
    }
}
