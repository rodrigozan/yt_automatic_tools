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
    outlineSummary: string;
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
Compare o novo capítulo com a story bible, o resumo acumulado da história e o outline planejado para ESTE capítulo específico, verificando pelo menos:
- Idade e aparência dos personagens.
- Ordem dos eventos.
- Ritmo do romance/conflito.
- Repetição de frases ou estruturas do capítulo anterior.
- Revelação de segredos da story bible que NÃO estejam previstos no outline planejado deste capítulo.

IMPORTANTE: o outline planejado deste capítulo já define o que DEVE acontecer nele — incluindo pistas ou revelações parciais de segredos, se o outline mencionar isso. NÃO marque como "revelação prematura" algo que o próprio outline deste capítulo pede para acontecer. Só marque revelação de segredo como problema se ela for além do que o outline planejado autoriza (ex: revelar o segredo por completo quando o outline só pedia uma pista sutil).

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

Outline planejado para o capítulo ${params.chapterNumber} (o que este capítulo DEVE cobrir):
${params.outlineSummary}

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
