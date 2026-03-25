# 🎥🤖 YouTube Automatic Tools 

Um conjunto abrangente de ferramentas para automação na criação e publicação de conteúdo para o YouTube, incluindo geração de histórias (scripts) potencializada por IA, composição de trilhas sonoras originais com Suno e upload otimizado e automatizado de vídeos.

## 📁 Estrutura do Projeto

Este repositório está organizado em dois componentes principais:

- **[`api`](./api)**: O servidor back-end construído com Node.js, Express e TypeScript. Responsável pela lógica central de negócios, integrações avançadas com as IAs (Google Gemini, Groq, Suno), comunicação com Banco de Dados (MongoDB) e comunicação completa com a API Oficial do YouTube.
- **[`web`](./web)**: O dashboard front-end construído em React, Vite, TypeScript e Tailwind CSS. Fornece uma interface de usuário moderna e rica para gerenciar os canais, os fluxos de trabalho e auditar as ferramentas de geração.

---

## ✨ Principais Funcionalidades

- **Integração Plena ao YouTube**: Fluxo OAuth2 completo e seguro para autorização de canais e uploads agendados/automatizados.
- **Geração de Scripts e Histórias**: Geração de roteiros de alta qualidade e narrativas curtas usando modelos líderes de IA.
- **Integração com a API Suno**: Crie trilhas sonoras dinâmicas e sob demanda integradas aos fluxos de conteúdo.
- **Automação de Metadados**: Geração automática de títulos magnéticos, descrições ricas com links configuráveis (Spotify, etc.) e tags otimizadas por IA.
- **Processamento Contínuo**: Conversão e processamento de áudio/vídeo.
- **Gerenciamento Unificado**: Administre múltiplos canais de YouTube de maneira centralizada.

---

## 🚀 Instalando o Projeto

### Pré-requisitos de Sistema

Certifique-se de ter os seguintes itens instalados:

- **Node.js** (versão 18 ou superior)
- **Gerenciadores de Pacote**: `yarn` e `npm`
- **MongoDB**: Banco de dados (rodando local em `mongodb://127.0.0.1:27017` ou em nuvem via Atlas)
- **FFmpeg**: Necessário nas variáveis de ambiente do seu sistema operacional para processamento de vídeo do back-end.

### 1. Configurando o Back-end (API)

Acesse a pasta da API para fazer a instalação das dependências usando o Yarn:

```bash
cd api
yarn install
```

Antes de rodar, é fundamental preencher suas configurações e tokens essenciais no arquivo `.env`. Na pasta `api`, crie seu `.env` com base no arquivo de exemplo e insira os dados:

```env
# 🌍 Servidor e Conexão de Banco de Dados
PORT=4500
DB_URI=mongodb://127.0.0.1:27017/yt-automatic-tools

# 🎥 Integração via API do YouTube
YT_CLIENT_ID=seu_client_id.apps.googleusercontent.com
YT_CLIENT_SECRET=seu_client_secret
YT_REDIRECT_URI=http://localhost:4500/api/youtube/oauth2callback

# 🤖 APIs de NLP e IA de Textos
GEM_API_KEY=sua_chave_gemini_aqui
GROQ_API_KEY=sua_chave_groq_aqui

# 🎵 Geração de Músicas (Suno e Replicate)
SUNO_API_KEY=sua_chave_da_suno
SUNO_BASE_URL=https://api.sunoapi.org/api/v1/
REPLICATE_API_KEY=sua_chave_opcional_da_replicate

# 📞 Integrações (Telegram e Pexels)
TG_API_ID=seu_id_telegram
TG_API_HASH=seu_hash_telegram
TG_SESSION=sua_sessao_string_telegram
TG_PHONE_NUMBER=seu_numero_celular
TG_PASSWORD=sua_senha_do_telegram
TB_CHANNEL_USERNAME=@seu_canal

PX_API_KEY=sua_chave_do_pexels_para_midias
PX_IMG_URI=https://api.pexels.com/v1/
PX_VIDEO_URI=https://api.pexels.com/videos/

# 🕵️ Segurança
JWT_SECRET=seu_segredo_para_sessao_de_usuarios
```

Para iniciar o servidor usando o Nodemon em modo de desenvolvimento:

```bash
yarn dev
```

### 2. Configurando o Front-end (Web)

Em um outro terminal, acesse a pasta da interface web:

```bash
cd web
npm install
```

Inicialize a interface usando o módulo do Vite:

```bash
npm run dev
```

---

## 🔌 Referência de Endpoints (API/Rotas)

A API fornece rotas diversas para o ecossistema. Abaixo está a lista detalhada de todos os serviços HTTP disponíveis sob o prefixo padrão `/api`:

### 🔐 Autenticação de Usuários 
Rotas destinadas à operação do próprio usuário criador na interface web:
- `POST /auth/register` - Registro de novo usuário de sistema.
- `POST /auth/login` - Login na plataforma com e-mail e senha.
- `POST /auth/google` - Fluxo de login Single Sign-On simplificado com o Google.

### ▶️ Integração YouTube (Canais e Publicação)
- `GET /youtube/auth` - Gera o link de autorização OAuth2 para integrar e permitir upload em um novo canal do YouTube.
- `GET /youtube/oauth2callback` - Rota de retorno para validar os tokens OAuth do Google em seu projeto.
- `GET /youtube/channels` - Lista todos os canais do YouTube que estão autenticados e permitidos para uso do usuário logado.
- `POST /youtube/upload` - Dispara o envio do arquivo do vídeo, Thumbnail e metadados diretamente para o canal.

### 🎵 Geração Automática de Músicas (Suno REST)
- `POST /suno/generate` - Inicia a geração de áudio baseado em prompts definidos de estilo e letras (tags).
- `GET /suno/status/:id` - Verifica a situação atual (pending, running, complete) de uma música em geração.
- `GET /suno/list` - Pega o histórico dos áudios gerados pelo seu usuário.
- `DELETE /suno/:id` - Remove a mídia previamente gerada por ID.
- `GET /suno/providers` - Retorna a lista de provedores/modelos de áudio configurados.

### 🎞️ Geração Híbrida de Vídeos e IA (Mídia Criativa)
- `POST /video/generate_by_image` - Monta um vídeo ou base visual a partir de imagem estática de fornecida no input.
- `POST /video/generate_by_video` - Combina ou extrai lógicas (áudio, base de música) a partir de inputs curtos de vídeo nativo.
- `POST /video/metadata` - Gera de forma 100% autônoma o **Título Otimizado**, **Descrição Detalhada** (incluindo placeholders customizados) e **Tags** do YouTube para o assunto do roteiro proposto.
- `POST /video/story/generate` - Solicita à IA um conto envolvente, script para shorts, ou script segmentado de um tema solicitado pelo respectivo criador.

### 🧠 Orquestração e Processamento Completo
- `POST /orchestrator/generate_and_upload` - **O núcleo prático do sistema**: Inicia o fluxo unificado combinando a extração do tema, montagem da música, junção através do FFmpeg nos bastidores e, finalizando todo o processo, realizando o upload automático (direto e agendado) no YouTube.

### 📤 Uploads Variados
- `POST /uploads/local` - Realiza envio em disco de arquivos, mídia massiva ou Assets da dashboard para a API (`multipart/form-data`).
- `POST /uploads/gdrive` - Espelha envios de media diretamente ao repositório ou pasta do Google Drive em nuvem.

---

## 🛠️ Tecnologias Utilizadas

- **Linguagem**: TypeScript & JavaScript
- **Back-end Base**: Node.js, Express.js
- **Banco de dados**: MongoDB & Mongoose
- **Processadores de Midia**: FFmpeg
- **Machine Learning & Plataformas Auxiliares**: `google-auth-library`, `@google/generative-ai` (Gemini), `groq-sdk`, SDK da Suno, Fluent-FFmpeg.
- **Front-end UI**: React 19, Vite, Tailwind CSS com componentes Shadcn/UI.

---

## 📄 Licença

Este projeto e seu respectivo código-fonte são mantidos sob a [Licença MIT](LICENSE) - veja o arquivo `LICENSE` para detalhes adicionais.
