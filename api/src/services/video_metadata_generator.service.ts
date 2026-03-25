import Groq from "groq-sdk";
import fs from 'fs/promises';

// Caminhos corrigidos conforme solicitado
import Metadata from "../models/metadata.models";
import { User } from "../models/user.model";
import { IMetadataInput, IMetadataResult } from "../interfaces/global.interface";

export class MetadataService {
    private groq: Groq;

    constructor() {
        this.groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });
    }

    public async create(data: IMetadataInput): Promise<IMetadataResult> {
        const { theme, niche, musicGenre, language, timestampFile, channelId } = data;

        // 0. Busca dados do canal no banco (spotify, youtube, instagram, tiktok)
        let spotifyProfile = '[SPOTIFY PROFILE]';
        let youtubeChannel = '[YOUTUBE CHANNEL]';
        let instagramProfile = '[INSTAGRAM PROFILE]';
        let tiktokProfile = '[TIKTOK PROFILE]';

        if (channelId) {
            const user = await User.findOne({ 'channels.channelId': channelId });
            if (user) {
                const channel = user.channels.find((c) => c.channelId === channelId);
                if (channel) {
                    if (channel.spotifyProfile) spotifyProfile = channel.spotifyProfile;
                    if (channel.youtubeChannel) youtubeChannel = channel.youtubeChannel;
                    if (channel.instagramProfile) instagramProfile = channel.instagramProfile;
                    if (channel.tiktokProfile) tiktokProfile = channel.tiktokProfile;
                }
            }
        }

        // 1. Leitura do arquivo de timestamps (se existir)
        let timestampContent = "";
        if (timestampFile) {
            try {
                timestampContent = await fs.readFile(timestampFile, 'utf-8');
            } catch (err) {
                console.warn(`⚠️ Aviso: Arquivo de timestamp não encontrado em: ${timestampFile}`);
                // Segue o fluxo sem o conteúdo do arquivo
            }
        }

        // 2. Geração da IA (Groq)
        const generatedData = await this.callAI(theme, niche, musicGenre, language);

        // 3. Tratamento das Keywords (Tags do YouTube - limite 500 chars)
        const finalKeywords = this.optimizeKeywordsCheck(generatedData.rawKeywords);

        // 4. Montagem da Descrição Final (Ordem Estrita)
        const isEnglish = language.toLowerCase() === 'english';

        // [A] Contexto (IA)
        let finalDescription = generatedData.description;

        // [B] Links — preenchidos com dados reais do canal
        finalDescription += `\n\nlisten in ${spotifyProfile}`;
        finalDescription += `\nwatch in ${youtubeChannel}`;
        if (instagramProfile !== '[INSTAGRAM PROFILE]') finalDescription += `\nfollow in ${instagramProfile}`;
        if (tiktokProfile !== '[TIKTOK PROFILE]') finalDescription += `\nfollow in ${tiktokProfile}`;

        // [C] Timestamps (do arquivo)
        if (timestampContent) {
            finalDescription += `\n\n${timestampContent}`;
        }

        // [D] Call to Action (CTA)
        const ctaText = isEnglish
            ? "Subscribe to the channel, hit the bell 🔔 and like the video! 👍\nFollow us on Instagram and TikTok."
            : "Inscreva-se no canal, ative o sininho 🔔 e curta o vídeo! 👍\nSiga-nos no Instagram e TikTok.";

        finalDescription += `\n\n${ctaText}`;

        // [F] Hashtags (Fim absoluto)
        if (generatedData.hashtags && Array.isArray(generatedData.hashtags)) {
            finalDescription += `\n\nHashtags\n${generatedData.hashtags.join(' ')}`;
        }

        // 5. Salva no Banco de Dados
        const newMetadata = await Metadata.create({
            theme,
            niche,
            musicGenre,
            language,
            generatedTitle: generatedData.title,
            generatedDescription: finalDescription,
            generatedKeywords: finalKeywords
        });

        return newMetadata;
    }

    private async callAI(theme: string, niche: string, musicGenre: string, language: string) {
        const langInstruction = language.toLowerCase() === 'english'
            ? "OUTPUT MUST BE IN ENGLISH."
            : "A SAÍDA DEVE SER EM PORTUGUÊS DO BRASIL.";

        const systemPrompt = `
      You are an expert YouTube SEO Copywriter.
      ${langInstruction}
      
      Output Rules:
      1. Return ONLY a valid JSON object.
      2. JSON keys: "title", "description", "hashtags", "rawKeywords".
    `;

        const userPrompt = `
      Generate metadata for a video:
      - Theme: ${theme}
      - Niche: ${niche}
      - Music Genre: ${musicGenre}
      
      Requirements:
      1. Title: Clickbait but relevant, optimized for search.
      2. Description: Write at least 1 paragraphs of engaging context. Do NOT include generic headers like "Introduction".
      3. Hashtags: Array of exactly 3 relevant hashtags.
      4. Keywords (rawKeywords): Array of 40+ long-tail tags/keywords.
    `;

        try {
            const completion = await this.groq.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.6,
                response_format: { type: "json_object" },
            });

            const content = completion.choices[0]?.message?.content || "{}";
            return JSON.parse(content);
        } catch (error) {
            console.error("Groq Error:", error);
            throw new Error("AI Generation Failed");
        }
    }

    private optimizeKeywordsCheck(keywords: string[]): string {
        const MAX_CHARS = 500;
        let result = "";

        if (!Array.isArray(keywords)) return "";

        for (const word of keywords) {
            const clean = word.trim();
            // Verifica se adicionar a palavra + vírgula estoura 500 chars
            if ((result.length + clean.length + (result.length > 0 ? 1 : 0)) <= MAX_CHARS) {
                result += (result.length > 0 ? "," : "") + clean;
            } else break;
        }
        return result;
    }
}