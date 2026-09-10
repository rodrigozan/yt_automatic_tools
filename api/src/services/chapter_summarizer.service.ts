import { OpenRouterService } from './openrouter.service';

export class ChapterSummarizerService {
    private openRouter: OpenRouterService;
    public readonly model: string;

    constructor() {
        this.openRouter = new OpenRouterService();
        this.model = process.env.OPENROUTER_MODEL_SUMMARY || 'openai/gpt-4o-mini';
    }

    public async summarize(chapterText: string): Promise<{
        summary: string;
        promptTokens: number;
        completionTokens: number;
    }> {
        const systemPrompt = `Você resume capítulos de romances de época em português do Brasil.
Escreva um resumo de 100 a 200 palavras, capturando eventos-chave, decisões dos personagens e mudanças de estado emocional/relacional relevantes para a continuidade da história.
Responda APENAS com o texto do resumo, sem markdown, sem título.`;

        const result = await this.openRouter.chatCompletion({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: chapterText },
            ],
            temperature: 0.4,
        });

        return {
            summary: result.content.trim(),
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
        };
    }
}
