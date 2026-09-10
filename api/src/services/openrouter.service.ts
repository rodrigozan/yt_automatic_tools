import axios from 'axios';
import { retryWithBackoff } from '../helpers/retryWithBackoff.helper';

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatCompletionResult {
    content: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
}

export interface SpeechResult {
    audio: Buffer;
    contentType: string;
}

interface ModelPricing {
    input: number;
    output: number;
}

const MODEL_PRICING_PER_MILLION_TOKENS: Record<string, ModelPricing> = {
    default: { input: 0.3, output: 0.6 },
    'openai/gpt-4o-mini': { input: 0.15, output: 0.6 },
    'openai/gpt-4o': { input: 2.5, output: 10 },
    'anthropic/claude-3.5-sonnet': { input: 3, output: 15 },
};

export class OpenRouterService {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY || '';
        this.baseUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
    }

    public isConfigured(): boolean {
        return !!this.apiKey;
    }

    public async chatCompletion(params: {
        model: string;
        messages: ChatMessage[];
        temperature?: number;
        jsonMode?: boolean;
        maxAttempts?: number;
    }): Promise<ChatCompletionResult> {
        if (!this.isConfigured()) throw new Error('OpenRouter não configurado: defina OPENROUTER_API_KEY');

        return retryWithBackoff(async () => {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: params.model,
                    messages: params.messages,
                    temperature: params.temperature ?? 0.8,
                    ...(params.jsonMode ? { response_format: { type: 'json_object' } } : {}),
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 120000,
                }
            );

            const choice = response.data?.choices?.[0];
            const content = choice?.message?.content ?? '';
            const usage = response.data?.usage ?? {};

            if (!content) throw new Error('OpenRouter retornou resposta vazia');

            return {
                content,
                model: params.model,
                promptTokens: usage.prompt_tokens ?? 0,
                completionTokens: usage.completion_tokens ?? 0,
            };
        }, {
            maxAttempts: params.maxAttempts ?? 3,
            onRetry: (attempt, error) =>
                console.error(`[OpenRouter] chatCompletion tentativa ${attempt} falhou:`, error.message),
        });
    }

    public async textToSpeech(params: {
        model: string;
        voice: string;
        input: string;
        maxAttempts?: number;
    }): Promise<SpeechResult> {
        if (!this.isConfigured()) throw new Error('OpenRouter não configurado: defina OPENROUTER_API_KEY');

        return retryWithBackoff(async () => {
            const response = await axios.post(
                `${this.baseUrl}/audio/speech`,
                {
                    model: params.model,
                    voice: params.voice,
                    input: params.input,
                    response_format: 'mp3',
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer',
                    timeout: 180000,
                }
            );

            return {
                audio: Buffer.from(response.data),
                contentType: String(response.headers['content-type'] || 'audio/mpeg'),
            };
        }, {
            maxAttempts: params.maxAttempts ?? 3,
            onRetry: (attempt, error) =>
                console.error(`[OpenRouter] textToSpeech tentativa ${attempt} falhou:`, error.message),
        });
    }

    public estimateChatCost(model: string, promptTokens: number, completionTokens: number): number {
        const pricing = MODEL_PRICING_PER_MILLION_TOKENS[model] ?? MODEL_PRICING_PER_MILLION_TOKENS.default;
        return (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000;
    }
}
