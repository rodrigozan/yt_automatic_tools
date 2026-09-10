import { Types } from 'mongoose';
import { OpenRouterService } from './openrouter.service';
import { ChapterModel } from '../models/chapter.model';
import { IStoryBible } from '../models/story_bible.model';
import { IPipelineMetadata } from '../models/pipeline_run.model';
import { extractJson } from '../utils/extract_json.utils';

export class NarrativeMetadataGeneratorService {
    private openRouter: OpenRouterService;
    public readonly model: string;

    constructor() {
        this.openRouter = new OpenRouterService();
        this.model = process.env.OPENROUTER_MODEL_METADATA || 'openai/gpt-4o-mini';
    }

    public async generate(pipelineRunId: Types.ObjectId, storyBible: IStoryBible): Promise<{
        metadata: IPipelineMetadata;
        promptTokens: number;
        completionTokens: number;
    }> {
        const chapters = await ChapterModel.find({ pipeline_run_id: pipelineRunId, status: 'approved' })
            .sort({ chapter_number: 1 })
            .select('chapter_number summary');

        const summariesText = chapters.map((c) => `Capítulo ${c.chapter_number}: ${c.summary}`).join('\n');

        const systemPrompt = `Você é um especialista em SEO e copywriting para YouTube, focado em vídeos narrativos longos (drama/romance de época) em português do Brasil.
Responda APENAS com um objeto JSON válido no formato:
{ "titles": string[], "description": string, "tags": string, "closing_question": string }
Regras:
- "titles": pelo menos 3 variações de título, chamativas mas fiéis ao conteúdo.
- "description": mínimo de 4 parágrafos, apresentando a história sem entregar o final.
- "tags": uma única linha de palavras-chave separadas por vírgula.
- "closing_question": pergunta reflexiva final para engajamento nos comentários.`;

        const userPrompt = `Story bible:
${JSON.stringify(storyBible)}

Resumo dos capítulos:
${summariesText}`;

        const result = await this.openRouter.chatCompletion({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            jsonMode: true,
        });

        const metadata = extractJson<IPipelineMetadata>(result.content);

        return {
            metadata,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
        };
    }
}
