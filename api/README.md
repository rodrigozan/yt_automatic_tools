# 🎬 YouTube Automatic Tools API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![YouTube](https://img.shields.io/badge/YouTube_API-FF0000?style=for-the-badge&logo=youtube&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)

**API RESTful para automação completa do pipeline de criação, edição e upload de vídeos para o YouTube.**

Gera vídeos musicais a partir de imagens/vídeos + áudio, cria metadados otimizados via IA (Gemini/Groq), gera músicas com Suno AI e faz upload automático para canais do YouTube — tudo via endpoints HTTP.

</div>

---

## 📑 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Como Usar](#-como-usar)
- [Arquitetura do Projeto](#-arquitetura-do-projeto)
- [Models](#-models)
- [Services](#-services)
- [Controllers](#-controllers)
- [Endpoints da API](#-endpoints-da-api)
  - [Autenticação](#-autenticação)
  - [Geração de Vídeo Musical](#-geração-de-vídeo-musical)
  - [Geração de Vídeo Individual](#-geração-de-vídeo-individual)
  - [Geração de Story](#-geração-de-story)
  - [Geração de Metadados](#-geração-de-metadados)
  - [Orquestrador (Geração + Upload)](#-orquestrador-geração--upload)
  - [Geração de Música (Suno/Replicate)](#-geração-de-música-sunoreplicate)
  - [Upload de Arquivos](#-upload-de-arquivos)
  - [YouTube — Autorização de Canal](#-youtube--autorização-de-canal)
  - [YouTube — Upload de Vídeo](#-youtube--upload-de-vídeo)
  - [YouTube — Listagem de Canais](#-youtube--listagem-de-canais)
  - [YouTube — Atualização de Canal](#-youtube--atualização-de-canal)
- [Swagger / Documentação Interativa](#-swagger--documentação-interativa)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **YouTube Automatic Tools** é uma API backend construída para automatizar todo o fluxo de trabalho de criação de conteúdo para o YouTube, especialmente voltado para canais de música (lofi, worship, gospel, R&B, etc.).

### Funcionalidades principais:

- 🎵 **Geração de vídeos musicais** — Combina imagens/vídeos de fundo com faixas de áudio usando FFmpeg, criando compilações tipo "playlist" ou vídeos individuais com efeitos visuais (partículas, luzes).
- 🤖 **Metadados via IA** — Utiliza Google Gemini e Groq para gerar automaticamente títulos SEO, descrições otimizadas e keywords para o YouTube.
- 🎶 **Geração de música com IA** — Integra com Suno AI e Replicate (MusicGen by Meta) para criar músicas originais a partir de prompts textuais.
- 📤 **Upload automático no YouTube** — Autoriza canais via OAuth2 e faz upload direto com metadados, thumbnails e agendamento.
- 🔐 **Autenticação** — Sistema de registro/login com JWT e login via Google OAuth.
- 📁 **Upload de arquivos** — Suporte a upload local via multipart e importação de arquivos do Google Drive.
- 📺 **Gerenciamento de canais** — Listagem, atualização e autorização de múltiplos canais YouTube por usuário.

---

## 🛠 Tecnologias Utilizadas

| Tecnologia | Uso |
|---|---|
| **Node.js** | Runtime JavaScript server-side |
| **TypeScript** | Tipagem estática e segurança de código |
| **Express 5** | Framework HTTP para rotas e middlewares |
| **MongoDB + Mongoose** | Banco de dados NoSQL e ODM |
| **FFmpeg** (`fluent-ffmpeg`) | Processamento e edição de vídeo/áudio |
| **Google APIs** (`googleapis`) | YouTube Data API v3, Google Drive, OAuth2 |
| **Google Gemini** (`@google/generative-ai`) | Geração de metadados via IA generativa |
| **Groq SDK** (`groq-sdk`) | Geração de metadados via LLM (fallback/alternativa) |
| **Suno AI** | Geração de músicas por prompt |
| **Replicate** | Fallback para geração de música (MusicGen by Meta) |
| **Pexels API** (`pexels`) | Busca de imagens e vídeos stock |
| **Telegram API** (`telegram`) | Integração com canais do Telegram |
| **msedge-tts** | Text-to-Speech (narração) |
| **Canvas** (`canvas`) | Geração e manipulação de imagens |
| **Multer** | Upload de arquivos multipart |
| **Swagger** (`swagger-jsdoc` + `swagger-ui-express`) | Documentação interativa da API |
| **JWT** (`jsonwebtoken`) | Autenticação via tokens |
| **bcryptjs** | Hash de senhas |
| **node-cron** | Agendamento de tarefas |
| **RSS Parser** (`rss-parser`) | Leitura de feeds RSS |
| **Nodemon + ts-node-dev** | Hot reload em desenvolvimento |

---

## 📋 Pré-requisitos

Antes de instalar, certifique-se de ter:

- **Node.js** >= 18.x
- **Yarn** (gerenciador de pacotes)
- **MongoDB** rodando localmente ou via Atlas
- **FFmpeg** instalado e disponível no PATH do sistema
- Credenciais do **Google Cloud** (OAuth2 para YouTube)
- Chaves de API para os serviços de IA (Gemini, Groq, Suno — conforme o que deseja usar)

---

## 🚀 Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/yt_automatic_tools.git

# 2. Acesse a pasta da API
cd yt_automatic_tools/api

# 3. Instale as dependências
yarn install
```

---

## ⚙ Configuração

Crie um arquivo `.env` na raiz do projeto (`api/.env`) com as seguintes variáveis:

```env
# 🌍 Servidor
PORT=4500
DB_URI=mongodb://127.0.0.1:27017/yt-automatic-tools

# 🔑 Google API OAuth (para login com Google)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET_KEY=seu_google_client_secret

# 🎥 YouTube API (OAuth2 para upload de vídeos)
YT_CLIENT_ID=seu_yt_client_id
YT_CLIENT_SECRET=seu_yt_client_secret
YT_REDIRECT_URI=http://localhost:4500/api/youtube/oauth2callback

# 🤖 IA — Chaves de API
GEM_API_KEY=sua_chave_gemini
GROQ_API_KEY=sua_chave_groq

# 🎵 Suno AI (Geração de Música)
SUNO_API_KEY=sua_chave_suno
SUNO_BASE_URL=https://api.sunoapi.org/api/v1/

# 🎵 Replicate — MusicGen (fallback)
REPLICATE_API_KEY=sua_chave_replicate

# 📞 Telegram API
TG_API_ID=seu_api_id
TG_API_HASH=seu_api_hash
TG_SESSION=sua_session_string
TG_PHONE_NUMBER=+55XXXXXXXXXXX
TG_PASSWORD=sua_senha
TB_CHANNEL_USERNAME=@seu_canal

# 🎥 Pexels API
PX_API_KEY=sua_chave_pexels
PX_IMG_URI=https://api.pexels.com/v1/
PX_VIDEO_URI=https://api.pexels.com/videos/

# 🕵️ JWT Secret
JWT_SECRET=sua_chave_jwt_secreta
```

### Descrição das variáveis

| Variável | Descrição |
|---|---|
| `PORT` | Porta em que o servidor roda (padrão: `4500`) |
| `DB_URI` | URI de conexão com o MongoDB |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET_KEY` | Credenciais OAuth2 do Google (login) |
| `YT_CLIENT_ID` / `YT_CLIENT_SECRET` | Credenciais OAuth2 da YouTube Data API v3 |
| `YT_REDIRECT_URI` | URL de callback do OAuth do YouTube |
| `GEM_API_KEY` | Chave da API do Google Gemini (geração de metadados) |
| `GROQ_API_KEY` | Chave da API do Groq (geração de metadados alternativa) |
| `SUNO_API_KEY` / `SUNO_BASE_URL` | Credenciais da Suno AI para geração de músicas |
| `REPLICATE_API_KEY` | Chave do Replicate para MusicGen (fallback) |
| `TG_*` | Credenciais do Telegram para integração com canais |
| `PX_API_KEY` | Chave da API do Pexels para busca de mídia stock |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |

---

## ▶ Como Usar

### Desenvolvimento

```bash
# Iniciar servidor com hot reload
yarn dev
```

O servidor estará disponível em `http://localhost:4500`.

### Produção

```bash
# Compilar TypeScript para JavaScript
yarn build

# Iniciar servidor compilado
yarn start
```

### Documentação Swagger

Após iniciar o servidor, acesse a documentação interativa:

```
http://localhost:4500/api-docs
```

---

## 🏗 Arquitetura do Projeto

O projeto segue o padrão **MVC (Model-View-Controller)** com uma camada de **Services** para a lógica de negócio:

```
src/
├── config/             # Configuração do Express (middleware, rotas, Swagger)
│   └── Express.ts
├── controllers/        # Recebem requisições HTTP e delegam para os services
├── database/           # Conexão com MongoDB
│   └── Connection.ts
├── helpers/            # Funções auxiliares (FFmpeg, formatação de tempo)
├── interfaces/         # Tipos TypeScript globais
│   └── global.interface.ts
├── models/             # Schemas do Mongoose (MongoDB)
├── routers/            # Definição de rotas e documentação Swagger
├── scripts/            # Scripts utilitários avulsos
├── services/           # Lógica de negócio principal
├── utils/              # Utilitários (detecção de gênero/tipo de canal)
├── router.ts           # Agregador central de todas as rotas
├── server.ts           # Ponto de entrada da aplicação
└── swagger_config.ts   # Configuração do Swagger/OpenAPI
```

---

## 📦 Models

Os models definem os schemas do MongoDB via Mongoose:

### `User` — Usuário

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `email` | `String` | ✅ | E-mail único do usuário |
| `password` | `String` | ❌ | Senha (hash bcrypt) |
| `googleId` | `String` | ❌ | ID do Google (login social) |
| `name` | `String` | ❌ | Nome do usuário |
| `picture` | `String` | ❌ | URL da foto de perfil |
| `channels` | `Channel[]` | ❌ | Array de canais YouTube vinculados |
| `createdAt` | `Date` | auto | Data de criação |
| `updatedAt` | `Date` | auto | Data de atualização |

### `Channel` — Canal YouTube (subdocumento do User)

| Campo | Tipo | Descrição |
|---|---|---|
| `channelId` | `String` | ID do canal no YouTube |
| `channelName` | `String` | Nome do canal |
| `channelNickname` | `String` | Apelido/alias do canal |
| `channelPath` | `String` | Caminho local de arquivos do canal |
| `channelGenre` | `String` | Gênero: `"christian"` ou `"secular"` |
| `channelType` | `String` | Tipo: `"music"`, `"story"`, `"podcast_clip"` |
| `refreshToken` | `String` | Refresh token do OAuth2 YouTube |
| `spotifyProfile` | `String` | Link do perfil Spotify |
| `youtubeChannel` | `String` | Link do canal YouTube |
| `instagramProfile` | `String` | Link do perfil Instagram |
| `tiktokProfile` | `String` | Link do perfil TikTok |
| `createdAt` / `updatedAt` | `Date` | Timestamps automáticos |

### `Metadata` — Metadados gerados via IA

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `theme` | `String` | ✅ | Tema do vídeo |
| `niche` | `String` | ✅ | Nicho do conteúdo |
| `musicGenre` | `String` | ✅ | Gênero musical |
| `language` | `String` | ✅ | Idioma dos metadados |
| `generatedTitle` | `String` | ✅ | Título gerado pela IA |
| `generatedDescription` | `String` | ✅ | Descrição gerada pela IA |
| `generatedKeywords` | `String` | ✅ | Keywords geradas (até 500 chars) |
| `createdAt` | `Date` | auto | Data de criação |

### `SunoMusic` — Músicas geradas por IA

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `sunoId` | `String` | ✅ | ID único da música (Suno ou Replicate) |
| `prompt` | `String` | ✅ | Prompt usado na geração |
| `provider` | `String` | ✅ | `"suno"` ou `"replicate"` |
| `status` | `String` | ✅ | `"queued"`, `"pending"`, `"streaming"`, `"complete"`, `"error"` |
| `audioUrl` | `String` | ❌ | URL do áudio gerado |
| `videoUrl` | `String` | ❌ | URL do vídeo (se disponível) |
| `imageUrl` | `String` | ❌ | URL da capa |
| `title` | `String` | ❌ | Título da música |
| `model_name` | `String` | ❌ | Modelo de IA utilizado |
| `tags` | `String` | ❌ | Tags/gêneros |
| `duration` | `Number` | ❌ | Duração em segundos |
| `localPath` | `String` | ❌ | Caminho local do arquivo baixado |
| `createdAt` / `updatedAt` | `Date` | auto | Timestamps |

---

## ⚙ Services

Os services contêm toda a **lógica de negócio** da aplicação:

| Service | Descrição |
|---|---|
| `auth.service.ts` | Hash de senha (bcrypt), geração de JWT, verificação de token Google |
| `user.service.ts` | Operações CRUD básicas de usuários |
| `video_music_playlist_generator.service.ts` | Gera vídeo compilação (playlist) usando FFmpeg — concatena múltiplas faixas de áudio com um vídeo/imagem de fundo |
| `video_music_by_files_generator.service.ts` | Gera vídeo processando arquivos individuais de áudio + vídeo/imagem, combinando em um único arquivo final |
| `video_individual_generator.service.ts` | Gera vídeos individuais (1 imagem + 1 música) com efeitos visuais de partículas e luzes via FFmpeg |
| `video_story_generator.service.ts` | Renderiza vídeos estilo story/shorts com narração e música de fundo |
| `video_metadata_generator.service.ts` | Gera título, descrição e keywords otimizados para SEO via Google Gemini ou Groq |
| `yt_metadata.service.ts` | Prepara metadados formatados para upload no YouTube (integra timestamps/chapters) |
| `music_generator.service.ts` | Orquestra geração de música entre Suno AI e Replicate (fallback automático) |
| `suno.service.ts` | Integração direta com a API do Suno AI — criação, polling e download de músicas |
| `replicate_music.service.ts` | Integração com Replicate (MusicGen by Meta) — geração e download de músicas |
| `image_animation_generator.service.ts` | Gera animações de imagens (efeitos de zoom, pan) via FFmpeg |
| `image_animation_generator.service_v2.ts` | Versão otimizada do gerador de animação de imagens |
| `yt_authorizate_channel.service.ts` | Fluxo completo de OAuth2 com Google — gera URL, processa callback, salva refresh token |
| `yt_upload_video.service.ts` | Upload de vídeos para o YouTube com metadados automáticos, thumbnails e agendamento |
| `yt_list_channels.service.ts` | Lista os canais YouTube autorizados de um usuário |
| `yt_update_channel.service.ts` | Atualiza os dados de um canal (nome, apelido, path, redes sociais, etc.) |

---

## 🎮 Controllers

Os controllers recebem as requisições HTTP, fazem validação básica e delegam para os services:

| Controller | Descrição |
|---|---|
| `auth.controller.ts` | Registro, login e login via Google |
| `video_music_generator.controller.ts` | Endpoints de geração de vídeo musical (por vídeo e por imagem) |
| `video_individual_generator.controller.ts` | Geração de vídeos individuais com efeitos |
| `video_story_generator.controller.ts` | Renderização de vídeos story |
| `video_metadata_generator.conroller.ts` | Geração de metadados via IA |
| `GenerateAndUploadVideosController.ts` | **Orquestrador** — gera vídeo + metadados + upload (pipeline completo) |
| `suno.controller.ts` | CRUD de músicas geradas por IA |
| `file_upload.controller.ts` | Upload local e download do Google Drive |
| `yt_authorizate_channel.controller.ts` | Autorização OAuth2 do YouTube |
| `yt_upload_video.controller.ts` | Upload manual de vídeos para o YouTube |
| `yt_list_channels.controller.ts` | Listagem de canais autorizados |
| `yt_update_channel.controller.ts` | Atualização de dados de canais |

---

## 📡 Endpoints da API

> **Base URL:** `http://localhost:4500/api`

---

### 🔐 Autenticação

#### `POST /api/auth/register`

Registra um novo usuário.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "name": "Nome do Usuário"
}
```

**Respostas:**
| Status | Descrição |
|---|---|
| `201` | Usuário criado com sucesso (retorna `user` + `token`) |
| `400` | Usuário já existe |
| `500` | Erro interno |

---

#### `POST /api/auth/login`

Faz login com e-mail e senha.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Respostas:**
| Status | Descrição |
|---|---|
| `200` | Login bem-sucedido (retorna `user` + `token`) |
| `401` | Credenciais inválidas |
| `500` | Erro interno |

---

#### `POST /api/auth/google`

Login via Google OAuth.

**Body:**
```json
{
  "token": "google_id_token_aqui"
}
```

**Respostas:**
| Status | Descrição |
|---|---|
| `200` | Login bem-sucedido (retorna `user` + `token`) |
| `401` | Token Google inválido |
| `500` | Erro interno |

---

### 🎥 Geração de Vídeo Musical

#### `POST /api/video/generate_by_video`

Gera um vídeo musical combinando faixas de áudio com vídeos de fundo.

**Body:**
```json
{
  "audioDir": "D:/YT Channels/MeuCanal/audios",
  "videoDir": "D:/YT Channels/MeuCanal/videos",
  "outputName": "compilacao_final",
  "type": "playlist"
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `audioDir` | `string` | ✅ | Caminho da pasta de áudios |
| `videoDir` | `string` | ✅ | Caminho da pasta de vídeos |
| `outputName` | `string` | ❌ | Nome do arquivo de saída |
| `type` | `string` | ✅ | `"playlist"` ou `"files"` |

**Respostas:**
| Status | Descrição |
|---|---|
| `200` | Vídeo gerado com sucesso |
| `400` | Parâmetros inválidos |
| `500` | Erro na geração |

---

#### `POST /api/video/generate_by_image`

Gera um vídeo musical combinando faixas de áudio com imagens de fundo (animadas).

**Body:**
```json
{
  "audioDir": "D:/YT Channels/MeuCanal/audios",
  "imageDir": "D:/YT Channels/MeuCanal/images",
  "videoDir": "D:/YT Channels/MeuCanal/output",
  "outputName": "compilacao_lofi",
  "type": "files"
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `audioDir` | `string` | ✅ | Caminho da pasta de áudios |
| `imageDir` | `string` | ✅ | Caminho da pasta de imagens |
| `videoDir` | `string` | ❌ | Caminho da pasta de saída do vídeo |
| `outputName` | `string` | ❌ | Nome do arquivo de saída |
| `type` | `string` | ✅ | `"playlist"` ou `"files"` |

**Respostas:**
| Status | Descrição |
|---|---|
| `200` | Vídeo gerado com sucesso |
| `400` | Parâmetros inválidos |
| `500` | Erro na geração |

---

### 🎞 Geração de Vídeo Individual

#### `POST /api/video/generate_individual`

Gera vídeos individuais (1 imagem + 1 música) com efeitos visuais de partículas e luzes via FFmpeg. Para cada imagem numerada (`01.jpeg`, `02.jpeg`, ...) encontrada na pasta, localiza o MP3 correspondente e gera um `.mp4` com efeitos.

**Body:**
```json
{
  "sourceDir": "D:/YT Channels/R&B Lofi/content",
  "outputDir": "D:/YT Channels/R&B Lofi/videos"
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `sourceDir` | `string` | ✅ | Pasta com imagens (01.jpeg…) e MP3s (01 - ….mp3) |
| `outputDir` | `string` | ❌ | Pasta de saída (padrão: `sourceDir`) |

**Resposta de sucesso (200):**
```json
{
  "message": "Todos os vídeos individuais gerados com sucesso!",
  "data": {
    "success": true,
    "generated": [
      {
        "imageName": "01.jpeg",
        "audioName": "01 - Aleluia.mp3",
        "videoPath": "D:/YT Channels/R&B Lofi/videos/01.mp4",
        "duration": "03:45"
      }
    ],
    "errors": []
  }
}
```

---

### 📖 Geração de Story

#### `POST /api/video/story/generate`

Renderiza vídeos estilo story/shorts com narração e música de fundo.

**Body:**
```json
{
  "targetPath": "D:/Stories/meu_story",
  "musicPath": "D:/Musicas/background.mp3"
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `targetPath` | `string` | ✅ | Caminho do diretório ou arquivo alvo |
| `musicPath` | `string` | ✅ | Caminho da música de fundo |

**Respostas:**
| Status | Descrição |
|---|---|
| `200` | Vídeo renderizado (`output_final_com_musica.mp4`) |
| `400` | Parâmetros ausentes |
| `404` | Diretório ou música não encontrados |
| `500` | Erro na renderização |

---

### 🤖 Geração de Metadados

#### `POST /api/video/metadata`

Gera título, descrição e keywords otimizados para SEO usando IA (Google Gemini ou Groq).

**Body:**
```json
{
  "theme": "Lofi Hip Hop para Estudar",
  "niche": "Música Relax",
  "musicGenre": "Lofi",
  "language": "pt-BR",
  "timestampFile": "D:/output/youtube_chapters.txt",
  "channelId": "UC_channel_id"
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `theme` | `string` | ✅ | Tema do vídeo |
| `niche` | `string` | ✅ | Nicho do conteúdo |
| `musicGenre` | `string` | ✅ | Gênero musical |
| `language` | `string` | ✅ | Idioma dos metadados (ex: `pt-BR`, `en`) |
| `timestampFile` | `string` | ❌ | Caminho do arquivo de timestamps |
| `channelId` | `string` | ❌ | ID do canal (para contexto) |

**Resposta (201):**
```json
{
  "theme": "Lofi Hip Hop para Estudar",
  "niche": "Música Relax",
  "musicGenre": "Lofi",
  "language": "pt-BR",
  "generatedTitle": "🎵 Lofi Hip Hop Mix 2026 | Beats para Estudar e Relaxar",
  "generatedDescription": "Relaxe com esta seleção de lofi hip hop...",
  "generatedKeywords": "lofi, hip hop, study, relax, ..."
}
```

---

### 🚀 Orquestrador (Geração + Upload)

#### `POST /api/orchestrator/generate_and_upload`

**Pipeline completo:** Gera o vídeo → Gera metadados via IA → Faz upload no YouTube. Tudo em uma única chamada.

**Body:**
```json
{
  "audioDir": "D:/YT Channels/MeuCanal/audios",
  "videoDir": "D:/YT Channels/MeuCanal/videos",
  "imageDir": "D:/YT Channels/MeuCanal/images",
  "outputName": "compilacao_gospel",
  "generationType": "playlist",
  "generationSource": "image",
  "theme": "Worship Music",
  "email": "usuario@email.com",
  "channelId": "UC_channel_id",
  "channelType": "music",
  "refreshToken": "1//token...",
  "channelLang": "en",
  "forceStyle": "christian"
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `audioDir` | `string` | ✅ | Pasta de áudios |
| `videoDir` | `string` | ✅ | Pasta de vídeos de fundo |
| `imageDir` | `string` | ❌ | Pasta de imagens (se `generationSource` = `"image"`) |
| `outputName` | `string` | ❌ | Nome do arquivo de saída |
| `generationType` | `string` | ✅ | `"playlist"` ou `"files"` |
| `generationSource` | `string` | ✅ | `"video"` ou `"image"` |
| `theme` | `string` | ✅ | Tema do vídeo (usado nos metadados) |
| `email` | `string` | ✅ | E-mail do usuário |
| `channelId` | `string` | ✅ | ID do canal YouTube |
| `channelType` | `string` | ✅ | Tipo do canal (`"music"`, `"story"`, etc.) |
| `refreshToken` | `string` | ❌ | Refresh token OAuth2 (buscado do banco se omitido) |
| `channelLang` | `string` | ❌ | Idioma do canal (padrão: `"en"`) |
| `forceStyle` | `string` | ❌ | `"christian"` ou `"secular"` |

**Resposta de sucesso (200):**
```json
{
  "message": "✅ Geração e Upload concluídos com sucesso!",
  "videoPath": "D:/output/compilacao_gospel.mp4",
  "videoId": "dQw4w9WgXcQ",
  "link": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "generationDetails": { ... }
}
```

---

### 🎶 Geração de Música (Suno/Replicate)

#### `POST /api/suno/generate`

Gera uma música usando Suno AI (primário) ou Replicate/MusicGen (fallback).

**Body:**
```json
{
  "prompt": "Calm lofi hip-hop with rain sounds",
  "instrumental": true,
  "durationSeconds": 30
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `prompt` | `string` | ✅ | Descrição da música desejada |
| `instrumental` | `boolean` | ❌ | Gerar sem vocais (padrão: `true`) |
| `durationSeconds` | `integer` | ❌ | Duração em segundos (padrão: `30`, usado pelo Replicate) |

**Respostas:**
| Status | Descrição |
|---|---|
| `202` | Geração iniciada — use `/suno/status/:id` para acompanhar |
| `400` | Prompt ausente |
| `500` | Falha na geração |

---

#### `GET /api/suno/status/:id`

Verifica o status de uma geração de música.

| Parâmetro | Local | Descrição |
|---|---|---|
| `id` | path | ID retornado por `/suno/generate` |

**Respostas:**
| Status | Descrição |
|---|---|
| `200` | Dados da música com status atual |
| `404` | Música não encontrada |

---

#### `GET /api/suno/list`

Lista todas as músicas geradas (com paginação).

| Parâmetro | Local | Padrão | Descrição |
|---|---|---|---|
| `page` | query | `1` | Número da página |
| `limit` | query | `20` | Itens por página |

---

#### `DELETE /api/suno/:id`

Deleta um registro de música.

| Parâmetro | Local | Descrição |
|---|---|---|
| `id` | path | ID da música |

---

#### `GET /api/suno/providers`

Lista os provedores de geração de música disponíveis (Suno e/ou Replicate, conforme as chaves configuradas).

---

### 📁 Upload de Arquivos

#### `POST /api/uploads/local`

Upload de arquivo via `multipart/form-data`.

**Body (form-data):**
| Campo | Tipo | Descrição |
|---|---|---|
| `file` | `binary` | Arquivo a ser enviado |

**Resposta (200):**
```json
{
  "message": "Arquivo enviado com sucesso.",
  "filePath": "D:/api/temp_uploads/1234567890-arquivo.mp3",
  "originalName": "arquivo.mp3",
  "mimetype": "audio/mpeg"
}
```

---

#### `POST /api/uploads/gdrive`

Baixa um arquivo do Google Drive para o servidor local.

**Body:**
```json
{
  "driveLinkOrId": "https://drive.google.com/file/d/ABC123/view",
  "fileName": "minha_musica.mp3"
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `driveLinkOrId` | `string` | ✅ | Link compartilhável ou ID do arquivo no Google Drive |
| `fileName` | `string` | ❌ | Nome para salvar o arquivo (com extensão) |

---

### 📺 YouTube — Autorização de Canal

#### `GET /api/youtube/auth`

Inicia o fluxo de autorização OAuth2 com o Google. Redireciona o usuário para a tela de consentimento do Google.

| Parâmetro | Local | Obrigatório | Descrição |
|---|---|---|---|
| `email` | query | ✅ | E-mail do usuário |

**Resposta:** Redirect `302` para o Google.

---

#### `GET /api/youtube/oauth2callback`

Callback do OAuth2. Processa o código de autorização e salva o refresh token do canal no banco.

| Parâmetro | Local | Obrigatório | Descrição |
|---|---|---|---|
| `code` | query | ✅ | Código de autorização do Google |
| `state` | query | ✅ | E-mail do usuário (codificado) |

**Resposta:** HTML confirmando o canal conectado.

---

### 📤 YouTube — Upload de Vídeo

#### `POST /api/youtube/upload`

Faz upload de um vídeo para o YouTube.

**Body:**
```json
{
  "videoDir": "D:/output/compilacao.mp4",
  "title": "Lofi Hip Hop Mix 2026",
  "description": "Relaxe com esta seleção...",
  "tags": ["lofi", "hip hop", "study"],
  "refreshToken": "1//token...",
  "channelLang": "pt-BR",
  "publishAt": "2026-04-20T14:00:00Z"
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `videoDir` | `string` | ✅ | Caminho do arquivo de vídeo |
| `title` | `string` | ✅ | Título do vídeo |
| `description` | `string` | ✅ | Descrição do vídeo |
| `tags` | `string[]` | ❌ | Array de tags |
| `refreshToken` | `string` | ❌ | Refresh token do canal |
| `channelLang` | `string` | ❌ | Idioma do canal |
| `publishAt` | `string` (ISO 8601) | ❌ | Data para publicação agendada |

**Respostas:**
| Status | Descrição |
|---|---|
| `200` | Upload concluído (retorna `videoId` e `link`) |
| `400` | Campos obrigatórios ausentes |
| `500` | Erro no upload |

---

### 📋 YouTube — Listagem de Canais

#### `GET /api/youtube/channels`

Lista os canais YouTube autorizados de um usuário.

| Parâmetro | Local | Obrigatório | Descrição |
|---|---|---|---|
| `email` | query | ✅ | E-mail do usuário |

**Resposta (200):**
```json
{
  "email": "usuario@email.com",
  "count": 2,
  "channels": [
    {
      "channelId": "UC_abc123",
      "channelName": "Meu Canal Lofi",
      "channelType": "music",
      "channelGenre": "secular"
    }
  ]
}
```

---

### ✏️ YouTube — Atualização de Canal

#### `PATCH /api/youtube/channels/:channelId`

Atualiza os dados de um canal YouTube vinculado ao usuário.

**Parâmetros de URL:**
| Parâmetro | Descrição |
|---|---|
| `channelId` | ID do canal a ser atualizado |

**Body:**
```json
{
  "email": "usuario@email.com",
  "channelName": "Novo Nome",
  "channelNickname": "meu_canal",
  "channelPath": "D:/YT Channels/MeuCanal",
  "channelGenre": "christian",
  "channelType": "music",
  "spotifyProfile": "https://open.spotify.com/artist/...",
  "youtubeChannel": "https://youtube.com/@meucanal",
  "instagramProfile": "https://instagram.com/meucanal",
  "tiktokProfile": "https://tiktok.com/@meucanal"
}
```

| Campo | Obrigatório | Descrição |
|---|---|---|
| `email` | ✅ | E-mail do usuário dono do canal |
| Demais campos | ❌ | Campos a serem atualizados (todos opcionais) |

**Respostas:**
| Status | Descrição |
|---|---|
| `200` | Canal atualizado com sucesso |
| `400` | Parâmetros obrigatórios ausentes |
| `500` | Erro na atualização |

---

## 📖 Swagger / Documentação Interativa

A API conta com documentação Swagger/OpenAPI gerada automaticamente a partir das anotações nos arquivos de rotas.

Após iniciar o servidor, acesse:

```
http://localhost:4500/api-docs
```

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `yarn dev` | Inicia o servidor em modo desenvolvimento com hot reload (nodemon + ts-node-dev) |
| `yarn build` | Compila o TypeScript para JavaScript na pasta `dist/` |
| `yarn start` | Inicia o servidor compilado (produção) |
| `yarn fetch_telegram_videos` | Script avulso para buscar vídeos de canais do Telegram |

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

Feito com ❤️ por **Rodrigo Alves**

</div>
