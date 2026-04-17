import { GoogleGenerativeAI } from "@google/generative-ai";
import { DailyPromptModel, IDailyPrompt } from "../models/daily_prompt.model";

type Genre = 'lofi' | 'soul_worship' | 'jazz';

const MASTER_PROMPTS: Record<Genre, string> = {
    lofi: `You are a professional AI image prompt engineer specializing in lofi hip-hop aesthetic photography.

Generate a detailed, specific image prompt for a lofi music visualization thumbnail.

Requirements:
- Subject: Black/African American person (female preferred)
- Expression: Eyes closed, serene, contemplative, peaceful
- Pose: Profile or 3/4 angle, relaxed posture
- Audio Equipment: Premium over-ear headphones (black or matte finish)
- Clothing: Casual, comfortable (turtleneck, ribbed sweater, or fitted t-shirt in dark colors)
- Lighting: Soft, directional lighting from one side creating subtle halos and depth
- Background: Neutral, dark tones (charcoal gray, deep black, with subtle gradients)
- Atmosphere: Cinematic quality, magazine/editorial photography
- Details: Small floating light particles, subtle glowing accents, professional color grading
- Mood: Introspective, peaceful, intimate, late-night vibe
- Style: Modern portrait photography, high-end aesthetic, 8K quality

Return ONLY the detailed image prompt (no explanations, no markdown).`,

    soul_worship: `You are a professional AI image prompt engineer specializing in soul and spiritual music visualization.

Generate a detailed, specific image prompt for a soul/worship music thumbnail.

Requirements:
- Subject: Black/African American person (confident posture)
- Expression: Serene but engaged, spiritual connection, peaceful confidence
- Pose: Upright, empowered posture, hand may touch headphone
- Audio Equipment: Modern premium headphones (can be gold, black, or contrasting colors)
- Clothing: Defined, intentional (patterned t-shirt, fitted turtleneck, quality fabric)
- Lighting: Dramatic and scenic lighting with rich color background
- Background: Rich colors (teal blue, deep blues, blacks with golden accents, or warm neutrals)
- Atmosphere: Uplifting, spiritual, powerful yet calm
- Details: Subtle light effects, professional lighting setup, cinematic depth
- Mood: Inspiring, soulful, connected, peaceful power
- Style: Professional portrait, spiritual aesthetic, 8K quality

Return ONLY the detailed image prompt (no explanations, no markdown).`,

    jazz: `You are a professional AI image prompt engineer specializing in jazz and vintage music aesthetics.

Generate a detailed, specific image prompt for a jazz music visualization.

Requirements:
- Subject: Person in thoughtful, artistic pose (can be any ethnicity for jazz diversity)
- Expression: Contemplative, artistic, sophisticated
- Pose: Relaxed but intentional, could be near instrument or deep in thought
- Audio Equipment: Stylish headphones (vintage-inspired, could be gold or warm metals)
- Clothing: Sophisticated, artistic (vintage-inspired, quality textures)
- Lighting: Warm tones (gold, amber, bronze), sophisticated and atmospheric
- Background: Rich, artistic background (could suggest a jazz club or studio)
- Atmosphere: Vintage, sophisticated, artistic, intimate
- Details: Warm color grading, artistic lighting, professional quality
- Mood: Sophisticated, artistic, timeless, deeply musical
- Style: Artistic portrait, vintage-modern fusion, 8K quality

Return ONLY the detailed image prompt (no explanations, no markdown).`
};

export class PromptGeneratorService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEM_API_KEY!);
    }

    async generateDailyPrompt(genre: Genre): Promise<string> {
        const today = new Date().toISOString().split('T')[0];
        const existing = await DailyPromptModel.findOne({ date: today, genre });

        if (existing) {
            console.log(`✅ Prompt existente reutilizado para ${genre} em ${today}`);
            return existing.prompt;
        }

        console.log(`🤖 Gerando novo prompt para ${genre}...`);

        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(MASTER_PROMPTS[genre]);
        const prompt = result.response.text().trim();

        await DailyPromptModel.create({
            date: today,
            genre,
            prompt,
            imagePath: '',
            generationStatus: 'pending',
        });

        console.log(`📝 Prompt salvo para ${genre}: ${prompt.substring(0, 80)}...`);
        return prompt;
    }

    async getPromptByGenreAndDate(genre: string, date: string): Promise<IDailyPrompt | null> {
        return DailyPromptModel.findOne({ genre, date });
    }

    async listPromptHistory(genre?: string, limit = 30): Promise<IDailyPrompt[]> {
        const query = genre ? { genre } : {};
        return DailyPromptModel.find(query).sort({ date: -1 }).limit(limit);
    }
}
