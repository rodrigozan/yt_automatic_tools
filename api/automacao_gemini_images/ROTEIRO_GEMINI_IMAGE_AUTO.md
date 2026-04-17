# 🎨 Roteiro: Automatizar Geração de Imagens com Gemini

**Status**: Pronto para Claude Code implementar  
**Estimado**: 4-6 horas  
**Dificuldade**: Média  

---

## 📋 Visão Geral da Solução

Ao invés de baixar imagens manualmente, o sistema vai:

1. **Gerar prompts diários** baseados em padrões visuais detectados nas imagens de referência
2. **Chamar Gemini API** com esses prompts para gerar imagens
3. **Salvar imagens** localmente para usar na geração de vídeos
4. **Persistir no BD** para rastreamento e reutilização

---

## 🎯 Análise Visual das Imagens de Referência

### Padrões Detectados:

#### **LOFI (Imagens 1, 2, 3, 5)**
- ✅ Pessoas de etnia negra/afro
- ✅ Fones de ouvido (sempre presentes)
- ✅ Olhos fechados, expressão serena e contemplativa
- ✅ Fundos neutros (cinza, preto, tons escuros)
- ✅ Iluminação lateral/suave com halos
- ✅ Roupa casual (turtleneck, camiseta)
- ✅ Ângulo de perfil ou 3/4
- ✅ Pequenos detalhes de luz (sparkles/flocos de luz)
- ✅ Qualidade cinematográfica, high-end photography

#### **SOUL WORSHIP (Imagens 4, 6)**
- ✅ Pessoas em posição mais ereta, postura confiante
- ✅ Fones de ouvido modernos (pretos, dourados)
- ✅ Fundos coloridos (azul teal, preto com destaques)
- ✅ Iluminação mais dramática e cênica
- ✅ Roupas mais definidas (camiseta com padrão, turtleneck branco)
- ✅ Expressão serena mas mais engajada
- ✅ Mão tocando o fone (elemento de interação)

#### **JAZZ (Sem referência direta, mas baseado em padrões de Soul)**
- ✅ Estilo vintage/retro (inspirado em jazz clássico)
- ✅ Instrumentos possíveis ou pessoas em atitude pensativa
- ✅ Tons mais quentes (ouro, âmbar, cores vibrantes)
- ✅ Atmosfera sofisticada e artística

---

## 🏗️ Arquitetura Proposta

```
api/src/
├── models/
│   └── daily_prompt.model.ts          [NOVO]
│
├── services/
│   ├── prompt_generator.service.ts    [NOVO]
│   ├── gemini_image_generator.service.ts [NOVO]
│   └── (serviços existentes)
│
├── controllers/
│   └── gemini_image.controller.ts     [NOVO]
│
├── routers/
│   └── gemini_image.router.ts         [NOVO]
│
└── router.ts                          [MODIFICAR]
```

---

## 📝 Passo 1: Criar Model `DailyPrompt`

**Arquivo**: `api/src/models/daily_prompt.model.ts`

```typescript
// Este arquivo armazena os prompts gerados para cada dia
// e mantém histórico de imagens geradas
```

**Responsabilidades**:
- Guardar prompt diário por gênero (lofi, soul_worship, jazz)
- Relacionar com imagem gerada
- Timestamp para saber quando foi criado
- Status de geração (pending, success, error)

**Schema**:
```
{
  _id: ObjectId,
  date: Date,                    // Data do prompt (YYYY-MM-DD)
  genre: enum ['lofi', 'soul_worship', 'jazz'],
  prompt: string,                // Prompt gerado
  imageUrl?: string,             // URL remota da imagem (se salva em cloud)
  localPath?: string,            // Caminho local: ./assets/generated_images/lofi-2025-01-15.jpg
  imagePath: string,             // Caminho completo da imagem gerada
  generationStatus: enum ['pending', 'success', 'error'],
  errorMessage?: string,         // Se houver erro
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🤖 Passo 2: Criar Service `PromptGeneratorService`

**Arquivo**: `api/src/services/prompt_generator.service.ts`

**Responsabilidades**:
- Gerar prompt MASTER adaptado ao gênero
- Chamar Gemini para criar variações diárias
- Salvar no BD (MongoDB)
- Validar se já existe prompt para o dia

**Método Principal**: `generateDailyPrompt(genre: 'lofi' | 'soul_worship' | 'jazz')`

**Fluxo**:
1. Verificar se já existe prompt para hoje neste gênero
2. Se não existir:
   - Chamar Gemini com o PROMPT MASTER (veja seção abaixo)
   - Salvar prompt no BD
3. Retornar o prompt

**PROMPT MASTER para Gemini** (Este é o coração da automação):

### LOFI MASTER PROMPT:
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

### SOUL WORSHIP MASTER PROMPT:
```
You are a professional AI image prompt engineer specializing in soul and spiritual music visualization.

Generate a detailed, specific image prompt for a soul/worship music thumbnail.

Requirements:
- Subject: Black/African American person (confident posture)
- Expression: Serene but engaged, spiritual connection, peaceful confidence
- Pose: Upright, empowered posture, hand may touch headphone
- Audio Equipment: Modern premium headphones (can be gold, black, or contrasting colors)
- Clothing: Defined, intentional (patterned t-shirt, fitted turtleneck, quality fabric)
- Lighting: Dramatic and cenic lighting with rich color background
- Background: Rich colors (teal blue, deep blues, blacks with golden accents, or warm neutrals)
- Atmosphere: Uplifting, spiritual, powerful yet calm
- Details: Subtle light effects, professional lighting setup, cinematic depth
- Mood: Inspiring, soulful, connected, peaceful power
- Style: Professional portrait, spiritual aesthetic, 8K quality

Return ONLY the detailed image prompt (no explanations, no markdown).
```

### JAZZ MASTER PROMPT:
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

---

## 🖼️ Passo 3: Criar Service `GeminiImageGeneratorService`

**Arquivo**: `api/src/services/gemini_image_generator.service.ts`

**Responsabilidades**:
- Chamar Gemini API com o prompt fornecido
- Baixar e salvar imagem localmente
- Retornar caminho da imagem
- Tratar erros de API

**Métodos**:
```typescript
async generateImage(prompt: string, genre: string): Promise<string>
// Retorna: caminho local da imagem salva
```

**Fluxo**:
1. Chamar Google Generative AI (Gemini) com o prompt
2. Receber URL da imagem gerada
3. Fazer download para: `./assets/generated_images/{genre}-{date}.jpg`
4. Validar se arquivo foi salvo
5. Retornar caminho completo do arquivo

**Integração com Gemini**:
```typescript
// Usar: @google/generative-ai (já está no package.json)
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEM_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
// ou "gemini-pro-vision" conforme disponibilidade
```

---

## 🎮 Passo 4: Criar Controller `GeminiImageController`

**Arquivo**: `api/src/controllers/gemini_image.controller.ts`

**Responsabilidades**:
- Orquestrar chamadas aos services
- Validar entrada
- Retornar resposta formatada

**Métodos**:
```typescript
generateDailyImage(genre: 'lofi' | 'soul_worship' | 'jazz')
// Endpoint: POST /gemini/generate-daily-image
```

**Fluxo**:
1. Validar gênero fornecido
2. Chamar `PromptGeneratorService.generateDailyPrompt(genre)`
3. Chamar `GeminiImageGeneratorService.generateImage(prompt, genre)`
4. Atualizar DB com localPath
5. Retornar resposta com caminhos e metadados

---

## 🛣️ Passo 5: Criar Router `GeminiImageRouter`

**Arquivo**: `api/src/routers/gemini_image.router.ts`

**Endpoints**:

### 1. Gerar imagem do dia
```
POST /gemini/generate-daily-image
Content-Type: application/json

{
  "genre": "lofi" | "soul_worship" | "jazz"
}

Response:
{
  "success": true,
  "message": "Imagem gerada com sucesso",
  "data": {
    "genre": "lofi",
    "date": "2025-01-15",
    "prompt": "...",
    "imagePath": "./assets/generated_images/lofi-2025-01-15.jpg",
    "generationStatus": "success"
  }
}
```

### 2. Listar histórico de prompts
```
GET /gemini/prompts-history?genre=lofi&limit=30

Response:
{
  "success": true,
  "data": [
    {
      "date": "2025-01-15",
      "genre": "lofi",
      "prompt": "...",
      "imagePath": "...",
      "generationStatus": "success"
    }
  ]
}
```

### 3. Gerar prompt manualmente (para testes)
```
POST /gemini/generate-prompt
Content-Type: application/json

{
  "genre": "lofi"
}

Response:
{
  "success": true,
  "data": {
    "prompt": "Professional AI image prompt...",
    "genre": "lofi"
  }
}
```

---

## 🔗 Passo 6: Integrar com Router Principal

**Arquivo**: `api/src/router.ts` (MODIFICAR)

Adicionar após imports:
```typescript
import { geminiImage } from './routers';

// ... dentro de setupRoutes ou onde outras rotas estão:
router.use(geminiImage);
```

**Arquivo**: `api/src/routers/index.ts` (VERIFICAR/MODIFICAR)

Adicionar export:
```typescript
export { default as geminiImage } from './gemini_image.router';
```

---

## 💾 Passo 7: Integrar com Geração de Vídeo Existente

**Modificar**: `api/src/routers/video_music_generator.router.ts`

Adicionar novo endpoint:
```
POST /video/generate_by_auto_image
Content-Type: application/json

{
  "genre": "lofi" | "soul_worship" | "jazz",
  "audioDir": "./assets/musics/...",
  "type": "playlist" | "files",
  "outputName": "custom_name" (opcional)
}
```

**Fluxo**:
1. Chamar `GeminiImageGeneratorService` para gerar imagem
2. Passar imagem gerada para `VideoGeneratorController.generate_by_image`
3. Continuar pipeline normal de vídeo

---

## 📦 Passo 8: Criar Diretório de Assets

```bash
# Criar diretório para imagens geradas
mkdir -p api/assets/generated_images

# Adicionar ao .gitignore:
api/assets/generated_images/*.jpg
api/assets/generated_images/*.png
```

---

## 🧪 Passo 9: Variáveis de Ambiente

**Adicionar ao `.env`**:
```env
# Gemini Image Generation
GEMINI_IMAGE_MODEL=gemini-2.0-flash
# GEM_API_KEY (já existe no projeto)

# Caminhos
GENERATED_IMAGES_PATH=./assets/generated_images
```

---

## 📋 Checklist de Implementação

Para o Claude Code seguir:

### Modelos
- [ ] Criar `daily_prompt.model.ts`
  - [ ] Interface `IDailyPrompt`
  - [ ] Schema MongoDB
  - [ ] Export do modelo

### Services
- [ ] Criar `prompt_generator.service.ts`
  - [ ] Classe `PromptGeneratorService`
  - [ ] Método `generateDailyPrompt(genre)`
  - [ ] Método `getPromptByGenreAndDate(genre, date)`
  - [ ] Método `listPromptHistory(genre, limit)`
  - [ ] Usar MASTER PROMPTS fornecidos acima

- [ ] Criar `gemini_image_generator.service.ts`
  - [ ] Classe `GeminiImageGeneratorService`
  - [ ] Método `generateImage(prompt, genre)`
  - [ ] Método privado `downloadAndSaveImage(url, genre)`
  - [ ] Validação de diretório
  - [ ] Tratamento de erros

### Controllers
- [ ] Criar `gemini_image.controller.ts`
  - [ ] Classe `GeminiImageController`
  - [ ] Método `generateDailyImage(req, res)`
  - [ ] Método `generatePrompt(req, res)`
  - [ ] Método `listPromptHistory(req, res)`
  - [ ] Validações

### Routers
- [ ] Criar `gemini_image.router.ts`
  - [ ] POST `/gemini/generate-daily-image`
  - [ ] POST `/gemini/generate-prompt`
  - [ ] GET `/gemini/prompts-history`

- [ ] Modificar `router.ts`
  - [ ] Importar novo router
  - [ ] Usar `router.use(geminiImage)`

- [ ] Modificar `routers/index.ts`
  - [ ] Exportar novo router

### Endpoints Video (Integração)
- [ ] Adicionar `POST /video/generate_by_auto_image` em `video_music_generator.router.ts`
  - [ ] Orquestrar chamada ao GeminiImageGeneratorService
  - [ ] Passar resultado para gerador de vídeo existente

### Setup
- [ ] Criar diretório `api/assets/generated_images`
- [ ] Adicionar ao `.gitignore`
- [ ] Atualizar `.env.example` com novas variáveis

---

## 🚀 Fluxo Completo de Uso

### Cenário 1: Gerar vídeo com imagem automática
```bash
# Cliente chama:
POST /video/generate_by_auto_image
{
  "genre": "lofi",
  "audioDir": "./assets/musics/lofi-chill.mp3",
  "type": "files"
}

# Backend:
1. Checa se existe prompt para lofi hoje
2. Se não, gera com PromptGeneratorService
3. Chama GeminiImageGeneratorService
4. Salva imagem em ./assets/generated_images/lofi-2025-01-15.jpg
5. Chama VideoGeneratorController.generate_by_image
6. Retorna vídeo final pronto
```

### Cenário 2: Reutilizar imagem gerada
```bash
# Próxima chamada no mesmo dia, mesmo gênero:
1. Detecta que já existe prompt/imagem para o dia
2. Reutiliza imagem existente
3. Pula geração de imagem (economiza créditos Gemini)
```

---

## 🔐 Considerações de Segurança

- [ ] Validar entrada `genre` contra enum
- [ ] Limitar taxa de requisições por IP
- [ ] Validar tamanho de arquivo baixado
- [ ] Tratar timeouts de API
- [ ] Logging de erros para debug

---

## 📊 Estrutura de Respostas

### Sucesso - Gerar Imagem
```json
{
  "success": true,
  "message": "Imagem gerada com sucesso",
  "data": {
    "genre": "lofi",
    "date": "2025-01-15",
    "prompt": "Professional AI image prompt engineer specializing...",
    "imagePath": "/absolute/path/to/assets/generated_images/lofi-2025-01-15.jpg",
    "generationStatus": "success",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Erro - API Gemini Falhou
```json
{
  "success": false,
  "error": "Falha ao gerar imagem com Gemini",
  "details": "API returned 429: Too many requests",
  "code": "GEMINI_API_ERROR"
}
```

---

## 💡 Tips para Claude Code

1. **Usar o padrão existente**: Os outros services seguem um padrão, mantenha consistência
2. **Error handling robusto**: Gemini pode falhar, tenha fallbacks
3. **Logging**: Use console.log com emojis como o projeto faz
4. **Types**: Sempre tipificar tudo em TypeScript
5. **Validações**: Validar genre, paths, etc
6. **Async/await**: Usar async/await, não callbacks

---

## 📚 Referências do Projeto

- Services: `api/src/services/suno.service.ts` (similar em estrutura)
- Models: `api/src/models/suno_music.model.ts` (template de modelo)
- Controllers: `api/src/controllers/video_music_generator.controller.ts` (padrão)
- Routers: `api/src/routers/suno.router.ts` (padrão de endpoint)

---

## ✅ Resultado Final

Ao final da implementação:
- ✅ Endpoint automático para gerar imagens com Gemini
- ✅ Prompts armazenados no BD para auditoria
- ✅ Reutilização de imagens no mesmo dia (economiza API calls)
- ✅ Integração transparente com gerador de vídeo existente
- ✅ Fluxo 100% automatizado: audio + gênero → vídeo completo
- ✅ Zero necessidade de criar/baixar imagens manualmente

---

## 🎯 Prioridade de Implementação

1. **CRÍTICO**: Model + PromptGeneratorService
2. **CRÍTICO**: GeminiImageGeneratorService
3. **ALTO**: Controller + Router
4. **ALTO**: Integração com video_music_generator
5. **MÉDIO**: Testes e refinamento
6. **BAIXO**: Dashboard/UI para visualizar histórico

---

Pronto! Este roteiro está completo e pronto para o Claude Code implementar. 🚀
