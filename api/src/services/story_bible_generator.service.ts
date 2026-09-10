import { Types } from 'mongoose';
import { OpenRouterService } from './openrouter.service';
import { StoryBibleModel, IStoryBible } from '../models/story_bible.model';
import { INarrativeBriefing } from '../models/pipeline_run.model';
import { extractJson } from '../utils/extract_json.utils';

const WORDS_PER_MINUTE_MIN = 130;
const WORDS_PER_MINUTE_MAX = 150;
export const WORDS_PER_CHAPTER_MIN = 900;
export const WORDS_PER_CHAPTER_MAX = 1400;

export interface IChapterPlan {
    chaptersPlanned: number;
    wordsPerChapterTarget: { min: number; max: number };
}

export class StoryBibleGeneratorService {
    private openRouter: OpenRouterService;
    public readonly model: string;

    constructor() {
        this.openRouter = new OpenRouterService();
        this.model = process.env.OPENROUTER_MODEL_PLANNING || 'openai/gpt-4o-mini';
    }

    public calculateChapterPlan(targetDurationMinutes: number): IChapterPlan {
        const totalWordsMin = targetDurationMinutes * WORDS_PER_MINUTE_MIN;
        const totalWordsMax = targetDurationMinutes * WORDS_PER_MINUTE_MAX;
        const totalWordsAvg = (totalWordsMin + totalWordsMax) / 2;

        const avgWordsPerChapter = (WORDS_PER_CHAPTER_MIN + WORDS_PER_CHAPTER_MAX) / 2;
        const chaptersPlanned = Math.max(1, Math.round(totalWordsAvg / avgWordsPerChapter));

        return {
            chaptersPlanned,
            wordsPerChapterTarget: { min: WORDS_PER_CHAPTER_MIN, max: WORDS_PER_CHAPTER_MAX },
        };
    }

    public async generate(
        pipelineRunId: Types.ObjectId,
        briefing: INarrativeBriefing,
        chaptersPlanned: number
    ): Promise<{ storyBible: IStoryBible; promptTokens: number; completionTokens: number }> {
        const systemPrompt = `Você é um roteirista especialista em dramas de época e romance para narração longa em português do Brasil.
Sua tarefa é criar uma "story bible" estruturada para uma história com exatamente ${chaptersPlanned} capítulos.
Responda APENAS com um objeto JSON válido, sem markdown, sem texto adicional, no seguinte formato:
{
  "title": string,
  "genre": string,
  "period": string,
  "location": string,
  "tone": string[],
  "characters": [{ "name": string, "role": string, "age": number, "appearance": string, "personality": string[], "secret": string | null, "relationships": [{ "with": string, "type": string }] }],
  "story_rules": string[],
  "central_goal": string,
  "outline": [{ "chapter_number": number, "summary_planned": string }]
}
O array "outline" deve ter exatamente ${chaptersPlanned} itens, um por capítulo, em ordem crescente, com progressão narrativa coerente (início, desenvolvimento, ponto de virada, clímax e desfecho).`;

        const userPrompt = `Gênero: ${briefing.genre}
Período/local: ${briefing.period}
Tom desejado: ${briefing.tone || 'a definir pela IA, condizente com o gênero'}
Premissa livre (opcional): ${briefing.premise || 'nenhuma, crie uma premissa original'}`;

        const result = await this.openRouter.chatCompletion({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.9,
            jsonMode: true,
        });

        const parsed = extractJson<Omit<IStoryBible, 'pipeline_run_id' | 'created_at'>>(result.content);

        const storyBible = await StoryBibleModel.findOneAndUpdate(
            { pipeline_run_id: pipelineRunId },
            { pipeline_run_id: pipelineRunId, ...parsed },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return {
            storyBible: storyBible.toObject(),
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
        };
    }
}
