import { Types } from 'mongoose';
import { OpenRouterService } from './openrouter.service';
import { ChapterModel } from '../models/chapter.model';
import { IStoryBible } from '../models/story_bible.model';
import { IVisualPrompt } from '../models/pipeline_run.model';
import { extractJson } from '../utils/extract_json.utils';
import { formatTime } from '../helpers/formatTime.helper';

const WORDS_PER_SECOND = 140 / 60;
const SECONDS_PER_PROMPT_AVG = 150;

export class VisualPromptGeneratorService {
    private openRouter: OpenRouterService;
    public readonly model: string;

    constructor() {
        this.openRouter = new OpenRouterService();
        this.model = process.env.OPENROUTER_MODEL_VISUAL || 'openai/gpt-4o-mini';
    }

    public async generateForRun(
        pipelineRunId: Types.ObjectId,
        storyBible: IStoryBible,
        existingPrompts: IVisualPrompt[] = []
    ): Promise<{
        visualPrompts: IVisualPrompt[];
        promptTokens: number;
        completionTokens: number;
    }> {
        const coveredChapters = new Set(existingPrompts.map((p) => p.chapter_number));

        const chapters = (await ChapterModel.find({ pipeline_run_id: pipelineRunId, status: 'approved' })
            .sort({ chapter_number: 1 }))
            .filter((chapter) => !coveredChapters.has(chapter.chapter_number));

        let elapsedSeconds = 0;
        const visualPrompts: IVisualPrompt[] = [...existingPrompts];
        let totalPromptTokens = 0;
        let totalCompletionTokens = 0;

        for (const chapter of chapters) {
            const chapterDurationSeconds = chapter.word_count / WORDS_PER_SECOND;
            const promptCount = Math.max(1, Math.round(chapterDurationSeconds / SECONDS_PER_PROMPT_AVG));

            const systemPrompt = `Você é um diretor de fotografia especialista em prompts para geração de imagens cinematográficas hiper-realistas.
Gere exatamente ${promptCount} prompts de imagem em inglês, estilo cinematográfico e hiper-realista, condizentes com período "${storyBible.period}", local "${storyBible.location}" e tom "${storyBible.tone.join(', ')}".
Os prompts devem seguir a ordem cronológica dos eventos do trecho fornecido.
Responda APENAS com um objeto JSON válido: { "prompts": string[] } com exatamente ${promptCount} itens.`;

            const result = await this.openRouter.chatCompletion({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Trecho do capítulo ${chapter.chapter_number}:\n${chapter.text}` },
                ],
                temperature: 0.8,
                jsonMode: true,
            });

            totalPromptTokens += result.promptTokens;
            totalCompletionTokens += result.completionTokens;

            const parsed = extractJson<{ prompts: string[] }>(result.content);
            const prompts = Array.isArray(parsed.prompts) && parsed.prompts.length ? parsed.prompts : [];
            const secondsPerPrompt = prompts.length ? chapterDurationSeconds / prompts.length : chapterDurationSeconds;

            prompts.forEach((prompt, index) => {
                const start = elapsedSeconds + index * secondsPerPrompt;
                const end = start + secondsPerPrompt;
                visualPrompts.push({
                    chapter_number: chapter.chapter_number,
                    time_range: `${formatTime(start)}-${formatTime(end)}`,
                    prompt,
                });
            });

            elapsedSeconds += chapterDurationSeconds;
        }

        return { visualPrompts, promptTokens: totalPromptTokens, completionTokens: totalCompletionTokens };
    }
}
