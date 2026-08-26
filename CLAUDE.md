# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouTube Automatic Tools is a content automation platform for YouTube. It generates AI-written scripts, AI-generated thumbnails, music via Suno, and assembles/uploads videos automatically. The repo is a **monorepo** with two independent apps:

- `api/` — Node.js + Express + TypeScript backend (port 4500 dev / 8002 prod)
- `web/` — React 19 + Vite + TypeScript + Tailwind CSS v4 frontend (port 3006)

---

## Development Commands

### API (run from `api/`)

```bash
yarn install          # install deps
yarn dev              # start dev server (nodemon + ts-node-dev, watches src/)
yarn build            # compile TypeScript → dist/
yarn start            # run compiled dist/app.js (production)
yarn fetch_telegram_videos  # one-off script via ts-node
```

### Web (run from `web/`)

```bash
yarn install          # install deps
yarn dev              # start Vite dev server on port 3006
yarn build            # tsc -b && vite build
yarn lint             # eslint
yarn preview          # preview production build
```

### Utility Scripts (run from `api/`)

```bash
npx ts-node src/scripts/create-user.ts   # seed a user into MongoDB
```

---

## API Architecture

**Entry point**: `src/server.ts` → instantiates `src/config/Express.ts`

`Express.ts` wires up:
1. Middleware: CORS, JSON body parser
2. MongoDB via `src/database/Connection.ts` (Mongoose)
3. Routes: all mounted at `/api`, Swagger UI at `/api-docs`

**Routing pattern**: `src/router.ts` aggregates all sub-routers from `src/routers/`. Each domain follows:

```
src/routers/<domain>.router.ts
  → src/controllers/<domain>.controller.ts
    → src/services/<domain>.service.ts
```

**Key route groups** (all under `/api`):
- `/auth` — register, login, Google SSO
- `/youtube/*` — OAuth2 channel auth, channel listing/update, video upload
- `/video/*` — music-by-image, music-by-video, metadata generation, story generation
- `/suno/*` — Suno music generation and management
- `/orchestrator/generate_and_upload` — full end-to-end pipeline (accepts an optional `platforms: ('youtube'|'facebook'|'instagram')[]`, defaults to `['youtube']`)
- `/uploads/local` and `/uploads/gdrive` — file intake
- `/gemini-image/*` — Gemini image generation pipeline
- `/meta/*` — Facebook Page / Instagram Business OAuth (mirrors `/youtube/auth` + `/youtube/oauth2callback`, scoped per `channelId`)
- `/publisher/publish` — standalone multi-platform publish (video/image/text) for already-generated media or non-video posts

**MongoDB models** (`src/models/`): `User`, `Channel`, `DailyPrompt`, `SunoMusic`, `Metadata`.

`Channel` holds the YouTube OAuth `refreshToken` alongside channel metadata (genre, type, social profiles) and an optional `meta` subdocument (`pageId`, `pageAccessToken`, `igUserId`, ...) with the connected Facebook Page / Instagram Business account. Users embed channel references via an array. See `src/services/social_publisher.service.ts` for the platform fan-out used by both the orchestrator and `/publisher/publish`.

**FFmpeg helpers** live in `src/helpers/` (`runFFmpegCommand`, `runFfmpegConcat`, `getDuration`, etc.) and wrap `fluent-ffmpeg`.

---

## Web Architecture

**Entry**: `src/main.tsx` → `App.tsx`

App wraps everything in: `ThemeProvider` → `GoogleOAuthProvider` → `AuthProvider` → `BrowserRouter`

**Auth**: `src/contexts/AuthContext.tsx` — currently runs in **demo mode**: `isAuthenticated` is always `true`, logout resets to a hardcoded `DEMO_USER`, and state is backed by `localStorage`. Real auth responses from the API can be stored via `login(user, token)`.

**API client**: `src/lib/api.ts` — Axios instance with `baseURL: '/api'`. The Vite dev proxy forwards `/api` → `http://localhost:8002`. Add new typed API functions here.

**Route layout**: All authenticated pages are wrapped in `<ProtectedRoute>` → `<MainLayout>` (which renders the `<Sidebar>`). Public routes are `/login` and `/signup`.

**Pages**: Dashboard, Upload, Channels, Tools, Settings.

---

## Environment Variables

### API (`api/.env`)

```env
PORT=4500
DB_URI=mongodb://127.0.0.1:27017/yt-automatic-tools

YT_CLIENT_ID=
YT_CLIENT_SECRET=
YT_REDIRECT_URI=http://localhost:4500/api/youtube/oauth2callback

# Google Drive (reuses the YouTube OAuth client + drive.file scope) — public-hosts
# generated videos/images so Facebook/Instagram Graph API can fetch them by URL
GOOGLE_API_KEY=

META_CLIENT_ID=
META_CLIENT_SECRET=
META_REDIRECT_URI=http://localhost:4500/api/meta/oauth2callback
META_GRAPH_API_VERSION=v21.0

GEM_API_KEY=
GROQ_API_KEY=

SUNO_API_KEY=
SUNO_BASE_URL=https://api.sunoapi.org/api/v1/
REPLICATE_API_KEY=

TG_API_ID=
TG_API_HASH=
TG_SESSION=
TG_PHONE_NUMBER=
TG_PASSWORD=
TB_CHANNEL_USERNAME=

PX_API_KEY=
PX_IMG_URI=https://api.pexels.com/v1/
PX_VIDEO_URI=https://api.pexels.com/videos/

JWT_SECRET=
GENERATED_IMAGES_PATH=./assets/generated_images   # optional
```

### Web (`web/.env`)

```env
VITE_GOOGLE_CLIENT_ID=   # Google OAuth client ID for Google SSO button
```

---

## External Integrations

| Service | SDK/lib | Purpose |
|---|---|---|
| Google Gemini | `@google/generative-ai` | Script generation + thumbnail images (`gemini-2.0-flash-preview-image-generation`) |
| Groq | `groq-sdk` | Alternative LLM for text generation |
| YouTube Data API v3 | `googleapis` | OAuth2 channel auth + video upload |
| Suno | REST (custom service) | Music generation |
| Replicate | REST | Alternative music generation |
| Pexels | `pexels` | Stock images/video |
| Telegram | `telegram` (MTProto) | Fetch videos from Telegram channels |
| FFmpeg | `fluent-ffmpeg` | Video/audio assembly — must be in system PATH |
| Google Drive | `googleapis` | File upload/download; also public-hosts media for Meta Graph API upload-by-URL |
| Meta Graph API | REST (custom service, native `fetch`) | Facebook Page + Instagram Business publishing (Reels, feed video/photo/text) |

---

## Naming Conventions

- API files: `<domain>.controller.ts`, `<domain>.service.ts`, `<domain>.router.ts`, `<domain>.model.ts`
- Helpers: `src/helpers/<name>.helper.ts`
- Utils: `src/utils/<name>.utils.ts`
- Web contexts: `src/contexts/<Name>Context.tsx`
