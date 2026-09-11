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

export interface ImageResult {
    image: Buffer;
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

function extractPcm16FromSseStream(body: string): Buffer {
    const chunks: Buffer[] = [];

    for (const line of body.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === '[DONE]') continue;

        try {
            const event = JSON.parse(raw);
            const audioData = event?.choices?.[0]?.delta?.audio?.data;
            if (audioData) chunks.push(Buffer.from(audioData, 'base64'));
        } catch {
            continue;
        }
    }

    return Buffer.concat(chunks);
}

function pcmToWav(pcm: Buffer, opts: { sampleRate: number; channels: number; bitsPerSample: number }): Buffer {
    const { sampleRate, channels, bitsPerSample } = opts;
    const blockAlign = (channels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
    const header = Buffer.alloc(44);

    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(pcm.length, 40);

    return Buffer.concat([header, pcm]);
}

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
                `${this.baseUrl}/chat/completions`,
                {
                    model: params.model,
                    stream: true,
                    modalities: ['text', 'audio'],
                    audio: { voice: params.voice, format: 'pcm16' },
                    messages: [
                        {
                            role: 'system',
                            content:
                                'Você é um narrador profissional de audiobook. Leia em voz alta, em português do Brasil, EXATAMENTE e na ÍNTEGRA o texto fornecido pelo usuário, do início ao fim, palavra por palavra, sem resumir, sem parafrasear, sem adicionar comentários, sem pular nenhuma frase.',
                        },
                        { role: 'user', content: params.input },
                    ],
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    responseType: 'text',
                    timeout: 180000,
                }
            );

            const pcm16 = extractPcm16FromSseStream(response.data as string);
            if (!pcm16.length) throw new Error('OpenRouter não retornou áudio');

            return {
                audio: pcmToWav(pcm16, { sampleRate: 24000, channels: 1, bitsPerSample: 16 }),
                contentType: 'audio/wav',
            };
        }, {
            maxAttempts: params.maxAttempts ?? 3,
            onRetry: (attempt, error) =>
                console.error(`[OpenRouter] textToSpeech tentativa ${attempt} falhou:`, error.message),
        });
    }

    public async generateImage(params: {
        model: string;
        prompt: string;
        aspectRatio?: string;
        maxAttempts?: number;
    }): Promise<ImageResult> {
        if (!this.isConfigured()) throw new Error('OpenRouter não configurado: defina OPENROUTER_API_KEY');

        return retryWithBackoff(async () => {
            const response = await axios.post(
                `${this.baseUrl}/chat/completions`,
                {
                    model: params.model,
                    modalities: ['image', 'text'],
                    messages: [{ role: 'user', content: params.prompt }],
                    image_config: { aspect_ratio: params.aspectRatio ?? '16:9' },
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 180000,
                }
            );

            const dataUri = response.data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (!dataUri) throw new Error('OpenRouter não retornou imagem');

            const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUri);
            if (!match) throw new Error('OpenRouter retornou imagem em formato inesperado');

            return {
                image: Buffer.from(match[2], 'base64'),
                contentType: match[1],
            };
        }, {
            maxAttempts: params.maxAttempts ?? 3,
            onRetry: (attempt, error) =>
                console.error(`[OpenRouter] generateImage tentativa ${attempt} falhou:`, error.message),
        });
    }

    public estimateChatCost(model: string, promptTokens: number, completionTokens: number): number {
        const pricing = MODEL_PRICING_PER_MILLION_TOKENS[model] ?? MODEL_PRICING_PER_MILLION_TOKENS.default;
        return (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000;
    }
}
