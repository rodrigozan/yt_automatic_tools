# Plano de Implementação — Automação de Imagens com Gemini

## Pré-requisitos confirmados

- `@google/generative-ai` v0.24.1 — já instalado
- `GEM_API_KEY` — já no `.env`
- MongoDB — já em uso
- FFmpeg — já integrado no pipeline

---

## Fase 1 — Foundation

**Agente:** `Backend Architect`

| Ação | Arquivo |
|------|---------|
| CRIAR | `src/models/daily_prompt.model.ts` |
| CRIAR | `assets/generated_images/` |
| EDITAR | `.env` |
| EDITAR | `.gitignore` |

**Detalhes:**
- `daily_prompt.model.ts` — Schema Mongoose com index único `{ date, genre }`, status enum `pending|success|error`
- `assets/generated_images/` — diretório físico para armazenar as imagens geradas
- `.env` — adicionar `GENERATED_IMAGES_PATH=./assets/generated_images`
- `.gitignore` — ignorar `assets/generated_images/*.jpg` e `assets/generated_images/*.png`

---

## Fase 2 — Core Services

**Agente:** `Backend Architect` + skill `claude-api`

### Task 2.1 — `src/services/prompt_generator.service.ts`

- Lógica de deduplicação: verifica se já existe prompt para `{ date: hoje, genre }` antes de chamar API
- Usa `gemini-2.0-flash` (geração de texto) com os 3 Master Prompts (lofi / soul_worship / jazz)
- Salva no MongoDB com `generationStatus: 'pending'`
- Métodos a implementar:
  - `generateDailyPrompt(genre: 'lofi' | 'soul_worship' | 'jazz'): Promise<string>`
  - `getPromptByGenreAndDate(genre: string, date: string): Promise<IDailyPrompt | null>`
  - `listPromptHistory(genre?: string, limit?: number): Promise<IDailyPrompt[]>`

**Master Prompts:**

<details>
<summary>LOFI</summary>

```
You are a professional AI image prompt engineer specializing in lofi hip-hop aesthetic photography.

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

Return ONLY the detailed image prompt (no explanations, no markdown).
```
</details>

<details>
<summary>SOUL WORSHIP</summary>

```
You are a professional AI image prompt engineer specializing in soul and spiritual music visualization.

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

Return ONLY the detailed image prompt (no explanations, no markdown).
```
</details>

<details>
<summary>JAZZ</summary>

```
You are a professional AI image prompt engineer specializing in jazz and vintage music aesthetics.

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

Return ONLY the detailed image prompt (no explanations, no markdown).
```
</details>

---

### Task 2.2 — `src/services/gemini_image_generator.service.ts`

> **Correção crítica em relação ao guia original:** o modelo correto para geração de imagens é
> `gemini-2.0-flash-preview-image-generation` com `responseModalities: ['IMAGE', 'TEXT']`.
> A resposta retorna `inlineData` (base64) — **não uma URL**.

```typescript
// Uso correto da API de imagem
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-preview-image-generation",
    generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
    } as any,
});

const result = await model.generateContent(prompt);
for (const part of result.response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
        const imageData = part.inlineData.data;   // base64 string
        const mimeType = part.inlineData.mimeType; // ex: "image/png"
        const ext = mimeType.split('/')[1];
        fs.writeFileSync(filepath, Buffer.from(imageData, 'base64'));
    }
}
```

**Lógica do service:**
1. Verificar se arquivo `{genre}-{date}.png` já existe em `GENERATED_IMAGES_PATH` → retornar caminho existente (economiza créditos)
2. Garantir que o diretório existe (criar se necessário com `fs.mkdirSync`)
3. Chamar Gemini com o prompt
4. Extrair `inlineData` e salvar como arquivo
5. Atualizar `DailyPromptModel` com `imagePath` e `generationStatus: 'success'`
6. Em caso de erro, atualizar `generationStatus: 'error'` com `errorMessage`

**Métodos:**
- `generateImage(prompt: string, genre: string): Promise<string>` — retorna `imagePath`
- `getExistingImage(genre: string): Promise<string | null>` — verifica se já existe imagem hoje

---

## Fase 3 — Controller + Router

**Agente:** `Backend Architect`

### Task 3.1 — `src/controllers/gemini_image.controller.ts`

- 3 métodos como **arrow functions** (padrão do projeto para binding correto)
- Validação de genre contra enum `['lofi', 'soul_worship', 'jazz']`

| Método | Endpoint |
|--------|----------|
| `generateDailyImage` | `POST /gemini/generate-daily-image` |
| `generatePrompt` | `POST /gemini/generate-prompt` |
| `listPromptHistory` | `GET /gemini/prompts-history` |

### Task 3.2 — `src/routers/gemini_image.router.ts`

```
POST /gemini/generate-daily-image   → controller.generateDailyImage
POST /gemini/generate-prompt        → controller.generatePrompt
GET  /gemini/prompts-history        → controller.listPromptHistory
```

### Task 3.3 — Registro das rotas

**`src/routers/index.ts`** — adicionar:
```typescript
export { default as geminiImage } from './gemini_image.router';
```

**`src/router.ts`** — importar e registrar:
```typescript
import { ..., geminiImage } from './routers';
router.use(geminiImage);
```

---

## Fase 4 — Integração com Video Generator

**Agente:** `Backend Architect`

**Arquivo:** `src/routers/video_music_generator.router.ts`

Adicionar endpoint `POST /video/generate_by_auto_image`:

```
Body: { genre, audioDir, type, outputName? }
```

**Fluxo:**
1. Chamar `PromptGeneratorService.generateDailyPrompt(genre)`
2. Chamar `GeminiImageGeneratorService.generateImage(prompt, genre)`
3. Instanciar `VideoMusicPlaylistService` ou `VideoMusicByFilesGeneratorService` e chamar `generate_with_image` com a imagem gerada

> Chamar os **services diretamente** — não instanciar nem mockar o controller.

**Resposta esperada:**
```json
{
  "message": "Vídeo gerado com imagem automática!",
  "data": {
    "genre": "lofi",
    "imagePath": "./assets/generated_images/lofi-2026-04-17.png",
    "videoPath": "..."
  }
}
```

---

## Fase 5 — Validação

**Agente:** `API Tester`

- Verificar se todos os arquivos foram criados nos caminhos corretos
- Confirmar que exports em `index.ts` e imports em `router.ts` estão corretos
- Checar tipos TypeScript (sem `any` desnecessários, `IDailyPrompt` importado onde precisa)
- Validar que o padrão de código do projeto foi seguido (console com emojis, async/await, classes com constructor)

**Testes via cURL após implementação:**

```bash
# Teste 1: Gerar prompt apenas
curl -X POST http://localhost:4500/api/gemini/generate-prompt \
  -H "Content-Type: application/json" \
  -d '{"genre":"lofi"}'

# Teste 2: Gerar imagem
curl -X POST http://localhost:4500/api/gemini/generate-daily-image \
  -H "Content-Type: application/json" \
  -d '{"genre":"lofi"}'

# Teste 3: Listar histórico
curl http://localhost:4500/api/gemini/prompts-history?genre=lofi

# Teste 4: Gerar vídeo com imagem automática
curl -X POST http://localhost:4500/api/video/generate_by_auto_image \
  -H "Content-Type: application/json" \
  -d '{"genre":"lofi","audioDir":"./assets/musics/lofi-chill.mp3","type":"files"}'
```

---

## Resumo dos arquivos afetados

| Ação | Arquivo |
|------|---------|
| CRIAR | `src/models/daily_prompt.model.ts` |
| CRIAR | `src/services/prompt_generator.service.ts` |
| CRIAR | `src/services/gemini_image_generator.service.ts` |
| CRIAR | `src/controllers/gemini_image.controller.ts` |
| CRIAR | `src/routers/gemini_image.router.ts` |
| CRIAR | `assets/generated_images/` |
| EDITAR | `src/routers/index.ts` |
| EDITAR | `src/router.ts` |
| EDITAR | `src/routers/video_music_generator.router.ts` |
| EDITAR | `.env` |
| EDITAR | `.gitignore` |
