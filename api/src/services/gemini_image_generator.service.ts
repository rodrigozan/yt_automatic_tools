import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { DailyPromptModel } from "../models/daily_prompt.model";

export class GeminiImageGeneratorService {
    private genAI: GoogleGenerativeAI;
    private generatedImagesDir: string;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEM_API_KEY!);
        this.generatedImagesDir = path.resolve(
            process.env.GENERATED_IMAGES_PATH || './assets/generated_images'
        );

        if (!fs.existsSync(this.generatedImagesDir)) {
            fs.mkdirSync(this.generatedImagesDir, { recursive: true });
            console.log(`📁 Diretório criado: ${this.generatedImagesDir}`);
        }
    }

    async getExistingImage(genre: string): Promise<string | null> {
        const today = new Date().toISOString().split('T')[0];
        const filename = `${genre}-${today}.png`;
        const filepath = path.join(this.generatedImagesDir, filename);

        if (fs.existsSync(filepath)) {
            console.log(`♻️ Imagem existente reutilizada: ${filepath}`);
            return filepath;
        }

        return null;
    }

    async generateImage(prompt: string, genre: string): Promise<string> {
        const today = new Date().toISOString().split('T')[0];

        const existing = await this.getExistingImage(genre);
        if (existing) return existing;

        console.log(`🎨 Gerando imagem para ${genre} com Gemini...`);

        try {
            const model = this.genAI.getGenerativeModel({
                model: 'gemini-2.0-flash-preview-image-generation',
                generationConfig: {
                    responseModalities: ['IMAGE', 'TEXT'],
                } as any,
            });

            const result = await model.generateContent(prompt);
            const parts = result.response.candidates?.[0]?.content?.parts ?? [];

            let savedPath: string | null = null;

            for (const part of parts) {
                if (part.inlineData) {
                    const { data, mimeType } = part.inlineData;
                    const ext = mimeType.split('/')[1] || 'png';
                    const filename = `${genre}-${today}.${ext}`;
                    const filepath = path.join(this.generatedImagesDir, filename);

                    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
                    savedPath = filepath;
                    console.log(`💾 Imagem salva em: ${filepath}`);
                    break;
                }
            }

            if (!savedPath) {
                throw new Error('Gemini não retornou dados de imagem na resposta');
            }

            await DailyPromptModel.updateOne(
                { date: today, genre },
                { imagePath: savedPath, generationStatus: 'success', updatedAt: new Date() }
            );

            return savedPath;

        } catch (error: any) {
            console.error(`❌ Erro ao gerar imagem para ${genre}:`, error.message);

            await DailyPromptModel.updateOne(
                { date: today, genre },
                { generationStatus: 'error', errorMessage: error.message, updatedAt: new Date() }
            );

            throw error;
        }
    }
}
