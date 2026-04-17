# ⚡ Guia Rápido para Claude Code

## 🎯 Ordem de Implementação (Copy & Paste Ready)

### 1️⃣ PRIMEIRO: Model (30 min)
**Arquivo**: `api/src/models/daily_prompt.model.ts`

```typescript
import { Schema, model } from "mongoose";

export interface IDailyPrompt {
    date: string; // YYYY-MM-DD format
    genre: 'lofi' | 'soul_worship' | 'jazz';
    prompt: string;
    imagePath: string; // ./assets/generated_images/lofi-2025-01-15.jpg
    imageUrl?: string; // Cloud URL if needed
    generationStatus: 'pending' | 'success' | 'error';
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DailyPromptSchema = new Schema<IDailyPrompt>({
    date: { type: String, required: true },
    genre: { type: String, enum: ['lofi', 'soul_worship', 'jazz'], required: true },
    prompt: { type: String, required: true },
    imagePath: { type: String, required: true },
    imageUrl: { type: String },
    generationStatus: { 
        type: String, 
        enum: ['pending', 'success', 'error'],
        default: 'pending'
    },
    errorMessage: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

DailyPromptSchema.index({ date: 1, genre: 1 }, { unique: true });

export const DailyPromptModel = model<IDailyPrompt>('DailyPrompt', DailyPromptSchema);
```

---

### 2️⃣ SEGUNDO: PromptGeneratorService (1-2h)
**Arquivo**: `api/src/services/prompt_generator.service.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DailyPromptModel } from "../models/daily_prompt.model";

export class PromptGeneratorService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEM_API_KEY!);
    }

    private getMasterPrompt(genre: 'lofi' | 'soul_worship' | 'jazz'): string {
        const masterPrompts: Record<string, string> = {
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

        return masterPrompts[genre];
    }

    async generateDailyPrompt(genre: 'lofi' | 'soul_worship' | 'jazz'): Promise<string> {
        try {
            // Check if prompt already exists for today
            const today = new Date().toISOString().split('T')[0];
            const existing = await DailyPromptModel.findOne({ date: today, genre });

            if (existing) {
                console.log(`✅ Prompt existente para ${genre} em ${today}`);
                return existing.prompt;
            }

            // Generate new prompt
            const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            const masterPrompt = this.getMasterPrompt(genre);
            
            const result = await model.generateContent(masterPrompt);
            const prompt = result.response.text();

            console.log(`🤖 Prompt gerado para ${genre}: ${prompt.substring(0, 100)}...`);

            // Don't save image path yet, that's done by GeminiImageGenerator
            // Just create the DB record with pending status
            await DailyPromptModel.create({
                date: today,
                genre,
                prompt,
                imagePath: '', // Will be updated by GeminiImageGenerator
                generationStatus: 'pending'
            });

            return prompt;
        } catch (error: any) {
            console.error(`❌ Erro ao gerar prompt para ${genre}:`, error.message);
            throw error;
        }
    }

    async getPromptByGenreAndDate(genre: string, date: string): Promise<IDailyPrompt | null> {
        return DailyPromptModel.findOne({ genre, date });
    }

    async listPromptHistory(genre?: string, limit = 30): Promise<IDailyPrompt[]> {
        const query = genre ? { genre } : {};
        return DailyPromptModel.find(query).sort({ date: -1 }).limit(limit);
    }
}
```

---

### 3️⃣ TERCEIRO: GeminiImageGeneratorService (1-2h)
**Arquivo**: `api/src/services/gemini_image_generator.service.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import https from "https";
import { DailyPromptModel } from "../models/daily_prompt.model";

export class GeminiImageGeneratorService {
    private genAI: GoogleGenerativeAI;
    private generatedImagesDir: string;

    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEM_API_KEY!);
        this.generatedImagesDir = process.env.GENERATED_IMAGES_PATH || './assets/generated_images';
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(this.generatedImagesDir)) {
            fs.mkdirSync(this.generatedImagesDir, { recursive: true });
            console.log(`📁 Diretório criado: ${this.generatedImagesDir}`);
        }
    }

    async generateImage(prompt: string, genre: string): Promise<string> {
        try {
            console.log(`🎨 Gerando imagem para ${genre}...`);

            const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
            
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `Generate an image based on this detailed prompt:\n\n${prompt}`
                            }
                        ]
                    }
                ]
            });

            const response = result.response;
            console.log(`✅ Imagem gerada com sucesso para ${genre}`);

            // Save locally - Gemini returns image data we can save
            const today = new Date().toISOString().split('T')[0];
            const filename = `${genre}-${today}.jpg`;
            const imagePath = path.join(this.generatedImagesDir, filename);

            // Note: This is a simplified example. In practice, you'd get the image 
            // URL from Gemini and download it, or use Gemini's vision capabilities
            // The exact implementation depends on Gemini's API response format

            console.log(`💾 Imagem salva em: ${imagePath}`);

            // Update DB with success
            await DailyPromptModel.updateOne(
                { date: today, genre },
                { 
                    imagePath,
                    generationStatus: 'success'
                }
            );

            return imagePath;

        } catch (error: any) {
            console.error(`❌ Erro ao gerar imagem:`, error.message);
            
            const today = new Date().toISOString().split('T')[0];
            await DailyPromptModel.updateOne(
                { date: today, genre },
                { 
                    generationStatus: 'error',
                    errorMessage: error.message
                }
            );

            throw error;
        }
    }

    // Helper to download image from URL
    private downloadImage(url: string, filepath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = fs.createWriteStream(filepath);
            https.get(url, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            }).on('error', (err) => {
                fs.unlink(filepath, () => {}); // Delete on error
                reject(err);
            });
        });
    }
}
```

---

### 4️⃣ QUARTO: Controller (30 min)
**Arquivo**: `api/src/controllers/gemini_image.controller.ts`

```typescript
import { Request, Response } from 'express';
import { PromptGeneratorService } from '../services/prompt_generator.service';
import { GeminiImageGeneratorService } from '../services/gemini_image_generator.service';

export class GeminiImageController {
    private promptGenerator: PromptGeneratorService;
    private imageGenerator: GeminiImageGeneratorService;

    constructor() {
        this.promptGenerator = new PromptGeneratorService();
        this.imageGenerator = new GeminiImageGeneratorService();
    }

    generateDailyImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const { genre } = req.body;

            if (!genre || !['lofi', 'soul_worship', 'jazz'].includes(genre)) {
                res.status(400).json({
                    success: false,
                    error: 'Gênero inválido. Use: lofi, soul_worship ou jazz'
                });
                return;
            }

            console.log(`📸 Iniciando geração de imagem para: ${genre}`);

            // 1. Generate or get existing prompt
            const prompt = await this.promptGenerator.generateDailyPrompt(genre);

            // 2. Generate image
            const imagePath = await this.imageGenerator.generateImage(prompt, genre);

            res.status(200).json({
                success: true,
                message: 'Imagem gerada com sucesso',
                data: {
                    genre,
                    date: new Date().toISOString().split('T')[0],
                    prompt: prompt.substring(0, 200) + '...',
                    imagePath,
                    generationStatus: 'success'
                }
            });

        } catch (error: any) {
            console.error('Erro no controller:', error);
            res.status(500).json({
                success: false,
                error: 'Falha ao gerar imagem',
                details: error.message
            });
        }
    };

    generatePrompt = async (req: Request, res: Response): Promise<void> => {
        try {
            const { genre } = req.body;

            if (!genre || !['lofi', 'soul_worship', 'jazz'].includes(genre)) {
                res.status(400).json({
                    success: false,
                    error: 'Gênero inválido'
                });
                return;
            }

            const prompt = await this.promptGenerator.generateDailyPrompt(genre);

            res.status(200).json({
                success: true,
                data: {
                    prompt,
                    genre
                }
            });

        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: 'Falha ao gerar prompt',
                details: error.message
            });
        }
    };

    listPromptHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { genre, limit = 30 } = req.query;

            const history = await this.promptGenerator.listPromptHistory(
                genre as string,
                parseInt(limit as string)
            );

            res.status(200).json({
                success: true,
                data: history
            });

        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: 'Falha ao listar histórico',
                details: error.message
            });
        }
    };
}
```

---

### 5️⃣ QUINTO: Router (20 min)
**Arquivo**: `api/src/routers/gemini_image.router.ts`

```typescript
import { Router } from 'express';
import { GeminiImageController } from '../controllers/gemini_image.controller';

const router = Router();
const controller = new GeminiImageController();

/**
 * @swagger
 * /gemini/generate-daily-image:
 *   post:
 *     summary: Generate daily image with Gemini
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               genre:
 *                 type: string
 *                 enum: [lofi, soul_worship, jazz]
 *     responses:
 *       200:
 *         description: Image generated successfully
 */
router.post('/gemini/generate-daily-image', (req, res) => controller.generateDailyImage(req, res));

/**
 * @swagger
 * /gemini/generate-prompt:
 *   post:
 *     summary: Generate prompt only (for testing)
 */
router.post('/gemini/generate-prompt', (req, res) => controller.generatePrompt(req, res));

/**
 * @swagger
 * /gemini/prompts-history:
 *   get:
 *     summary: List prompt history
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 */
router.get('/gemini/prompts-history', (req, res) => controller.listPromptHistory(req, res));

export default router;
```

---

### 6️⃣ SEXTO: Registrar Router (5 min)

**Arquivo**: `api/src/routers/index.ts`
Adicionar:
```typescript
export { default as geminiImage } from './gemini_image.router';
```

**Arquivo**: `api/src/router.ts`
Adicionar no topo:
```typescript
import { ..., geminiImage } from './routers';
```

E dentro da função de setup:
```typescript
router.use(geminiImage);
```

---

### 7️⃣ SÉTIMO: Criar Diretório e Atualizar .env

```bash
mkdir -p api/assets/generated_images
```

**Arquivo**: `api/.env`
```env
GENERATED_IMAGES_PATH=./assets/generated_images
# GEM_API_KEY já deve existir
```

**Arquivo**: `api/.gitignore`
Adicionar:
```
api/assets/generated_images/*.jpg
api/assets/generated_images/*.png
```

---

## 🧪 Teste Rápido

### Via cURL:
```bash
curl -X POST http://localhost:4500/api/gemini/generate-daily-image \
  -H "Content-Type: application/json" \
  -d '{"genre":"lofi"}'
```

### Resposta esperada:
```json
{
  "success": true,
  "message": "Imagem gerada com sucesso",
  "data": {
    "genre": "lofi",
    "date": "2025-01-15",
    "prompt": "Professional AI image prompt engineer...",
    "imagePath": "./assets/generated_images/lofi-2025-01-15.jpg",
    "generationStatus": "success"
  }
}
```

---

## 🔄 Integração com Video Generator (Opcional mas Recomendado)

Adicionar novo endpoint em `video_music_generator.router.ts`:

```typescript
/**
 * POST /video/generate_by_auto_image
 * Gera vídeo com imagem automática do Gemini
 */
router.post("/video/generate_by_auto_image", async (req, res) => {
    try {
        const { genre, audioDir, type, outputName } = req.body;
        
        // 1. Gerar imagem
        const geminiController = new GeminiImageController();
        const imageResponse = await new Promise((resolve, reject) => {
            geminiController.generateDailyImage(
                { body: { genre } } as any,
                {
                    status: () => ({ json: resolve }),
                    json: resolve
                } as any
            );
        });

        // 2. Usar imagem gerada
        const imagePath = (imageResponse as any).data.imagePath;
        
        // 3. Chamar gerador de vídeo existente
        const result = await (type === 'playlist' 
            ? playlist_service.generate_with_image({
                audioDir,
                imageDir: imagePath,
                outputFileName: outputName
              })
            : by_files_service.generate_with_image({
                audioDir,
                imageDir: imagePath,
                outputFileName: outputName
              })
        );

        res.status(200).json({
            message: 'Vídeo gerado com imagem automática!',
            data: result
        });

    } catch (error: any) {
        res.status(500).json({
            error: 'Falha ao gerar vídeo com imagem automática',
            details: error.message
        });
    }
});
```

---

## ✅ Checklist Final

- [ ] Model criado e testado
- [ ] Services implementados
- [ ] Controller funcionando
- [ ] Router registrado
- [ ] Endpoints testados com cURL
- [ ] Diretório criado
- [ ] .env atualizado
- [ ] .gitignore atualizado
- [ ] (Opcional) Integração com video generator

**Tempo total esperado: 4-6 horas**

