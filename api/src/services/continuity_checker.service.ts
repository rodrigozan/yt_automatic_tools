import { OpenRouterService } from './openrouter.service';
import { IStoryBible } from '../models/story_bible.model';
import { IContinuityIssue } from '../models/chapter.model';
import { extractJson } from '../utils/extract_json.utils';
import { IPriorSummary } from './chapter_generator.service';

export interface ICheckContinuityParams {
    storyBible: IStoryBible;
    priorSummaries: IPriorSummary[];
    chapterNumber: number;
    chapterText: string;
}

export class ContinuityCheckerService {
    private openRouter: OpenRouterService;
    public readonly model: string;

    constructor() {
        this.openRouter = new OpenRouterService();
        this.model = process.env.OPENROUTER_MODEL_CONTINUITY || 'openai/gpt-4o-mini';
    }

    public async check(params: ICheckContinuityParams): Promise<{
        issues: IContinuityIssue[];
        promptTokens: number;
        completionTokens: number;
    }> {
        const systemPrompt = `Você é um editor de continuidade narrativa especializado em dramas de época e romance.
Compare o novo capítulo com a story bible e o resumo acumulado da história, verificando pelo menos:
- Idade e aparência dos personagens.
- Ordem dos eventos.
- Ritmo do romance/conflito.
- Não revelação prematura de segredos definidos na story bible.
- Repetição de frases ou estruturas do capítulo anterior.

Responda APENAS com um objeto JSON válido no formato:
{ "issues": [{ "description": string, "severity": "bloqueante" | "alerta" }] }
Use "issues": [] caso não encontre nenhum problema.`;

        const summariesText = params.priorSummaries.length
            ? params.priorSummaries.map((s) => `Capítulo ${s.chapter_number}: ${s.summary}`).join('\n')
            : 'Nenhum capítulo anterior.';

        const userPrompt = `Story bible:
${JSON.stringify(params.storyBible)}

Resumo acumulado dos capítulos anteriores:
${summariesText}

Novo capítulo (número ${params.chapterNumber}) a ser verificado:
${params.chapterText}`;

        const result = await this.openRouter.chatCompletion({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            jsonMode: true,
        });

        const parsed = extractJson<{ issues: IContinuityIssue[] }>(result.content);

        return {
            issues: Array.isArray(parsed.issues) ? parsed.issues : [],
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
        };
    }
}
