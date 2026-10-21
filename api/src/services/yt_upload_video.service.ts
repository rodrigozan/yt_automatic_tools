import fs from "fs";
import { google } from "googleapis";
import { config } from "dotenv";
import { PublishedVideoModel } from "../models/published_video.model";
import { PublishLogModel } from "../models/publish_log.model";
import { parsePublishOptions, PublishOptions } from "../utils/publish_options.utils";

/* --- Models --- */
import { User } from "../models/user.model";

/* --- Services  --- */
import { MetadataService } from "./video_metadata_generator.service";

/* --- Utils --- */
import { getStatus } from "../utils/get_status.utils";
import { detectChannelGenre } from "../utils/detect_channel_genre.utils";
import { isShortFormContent } from "../utils/is_short_form_content.utils";

config();

export class YtUploadVideoService {

  static async uploadWithAutoMetadata(
    videoPath: string,
    chaptersFilePath: string,
    theme: string,
    // Argumentos de Upload
    email: string,
    channelId: string,
    channelType: string, // "music", "story", "podcast_clip" (Define Categoria YT)
    refreshToken?: string,
    channelLang: string = "en",
    forceStyle?: "christian" | "secular",
    niche?: string,
    musicGenre?: string
  ) {
    // 1. Define parâmetros para a IA
    const resolvedNiche = niche || channelType || "music";
    const resolvedMusicGenre = musicGenre || detectChannelGenre(theme) || "lofi";
    const resolvedLanguage = channelLang.startsWith("pt") ? "portuguese" : "english";

    console.log(`🤖 Gerando metadados com Groq... | Tipo YT: ${channelType} | Nicho: ${resolvedNiche} | Gênero: ${resolvedMusicGenre}`);

    // 2. Chama MetadataService (Groq) com fallback
    const metadataService = new MetadataService();
    let title: string;
    let description: string;
    let tags: string[];

    try {
      const result = await metadataService.create({
        theme,
        niche: resolvedNiche,
        musicGenre: resolvedMusicGenre,
        language: resolvedLanguage,
        channelId,
        timestampFile: chaptersFilePath,
      });

      title = result.generatedTitle;
      description = result.generatedDescription;
      // generatedKeywords é uma string CSV — converte para array de tags e aplica filtros do YouTube
      let rawTags = result.generatedKeywords
        ? result.generatedKeywords
            .replace(/[<>"]/g, "") // YouTube repudia tags com <, > e aspas
            .split(",")
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0 && t.length < 50)
        : [];
        
      // O YouTube tem um limite de ~400/500 caracteres somando todas as tags
      let tagsCharCount = 0;
      const safeTags: string[] = [];
      for (const tag of rawTags) {
        if (tagsCharCount + tag.length <= 400) {
          safeTags.push(tag);
          tagsCharCount += tag.length + 1;
        }
      }
      tags = safeTags;
    } catch (error) {
      console.warn("⚠️ Falha ao gerar metadados com Groq. Usando fallback.");
      title = "Insira o titulo";
      description = "Insira a descrição";
      tags = [];
    }

    console.log(`✨ Título: ${title}`);

    // 3. Faz o Upload (passando o channelType correto para a categoria)
    return this.uploadToYouTube(
      videoPath,
      title,
      description,
      tags,
      refreshToken,
      channelLang,
      undefined, // Deixa o getStatus decidir o horário padrão (20h)
      email,
      channelId,
      channelType // <--- Mantém o original para definir a Categoria ID
    );
  }

  static async uploadToYouTube(
    videoPath: string,
    title: string,
    description: string,
    tags: string[],
    refreshToken?: string,
    channelLang?: string,
    publishAt?: Date | string,
    email?: string,
    channelId?: string,
    channelType?: string,
    publishOptions?: PublishOptions
  ) {
    if (!fs.existsSync(videoPath))
      throw new Error(`Arquivo de vídeo não encontrado: ${videoPath}`);

    let channel: any = null;
    if (channelId) {
      const user = await User.findOne({ "channels.channelId": channelId });
      channel = user?.channels.find((c) => c.channelId === channelId);
    }
    if (!channel) channel = { genre: channelLang || "en" };

    // 🔑 Autenticação YouTube
    const oauth2Client = new google.auth.OAuth2(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI
    );

    const activeToken = channel?.refreshToken || refreshToken || process.env.YT_REFRESH_TOKEN;

    oauth2Client.setCredentials({
      refresh_token: activeToken,
    });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const fileSize = fs.statSync(videoPath).size;

    // 🌐 Detecta categoria e idioma
    let categoryId = "1";
    if (channelType === "music")
      categoryId = "10";
    else if (channelType === "story")
      categoryId = "24";
    else if (channelType === "podcast_clip")
      categoryId = "24";
    else categoryId = "22";

    let defaultLang = channelLang ?? "en";
    if (!channelLang) {
      if (/[áéíóúãõç]/i.test(title)) defaultLang = "pt-BR";
      else if (/[¿¡]/i.test(title)) defaultLang = "es";
      else defaultLang = "en";
    }
    const validLangs = ["en", "pt", "pt-BR", "es", "fr", "de", "it", "ja"];
    if (!validLangs.includes(defaultLang)) defaultLang = "en";

    console.log("📤 Iniciando upload para YouTube:", title);
    console.log(
      `🌐 Idioma: ${defaultLang.toUpperCase()} | Categoria: ${categoryId}`
    );

    //const optimizedDescription = YouTubeService.generateOptimizedDescription(title, channel);

    // 🧹 Sanitiza o título (Remove < >, impede vazio e limita a 90 chars para caber o #Shorts)
    if (!title || typeof title !== "string" || title.trim() === "") {
      title = `Vídeo Automático ${Date.now()}`;
    }
    title = title.replace(/[<>]/g, "").trim();
    if (title.length > 85) {
      title = title.substring(0, 85) + "...";
    }

    // 🩳 Shorts detection
    const isShort = isShortFormContent({ channelType, title });
    if (isShort) {
      console.log(
        "🎞️ Detectado formato Shorts — aplicando regras especiais..."
      );
      if (!title.toLowerCase().includes("#shorts")) title += " #Shorts";
      description += "\n\n#Shorts";
    }

    // Com publishOptions (endpoint /youtube/upload) o status é o escolhido pelo chamador;
    // sem ele, mantém o comportamento legado (Shorts públicos, longos agendados às 20h).
    const status = publishOptions
      ? {
          madeForKids: false,
          selfDeclaredMadeForKids: false,
          privacyStatus: publishOptions.privacyStatus,
          ...(publishOptions.publishAt ? { publishAt: publishOptions.publishAt } : {}),
        }
      : getStatus(isShort, publishAt);

    try {
      const response = await youtube.videos.insert(
        {
          part: ["snippet", "status"],
          notifySubscribers: false,
          requestBody: {
            snippet: {
              title,
              description,
              tags,
              categoryId,
              defaultLanguage: defaultLang,
              defaultAudioLanguage: defaultLang,
            },
            status: status,
          },
          media: { body: fs.createReadStream(videoPath) },
        },
        {
          onUploadProgress: (evt) => {
            const progress = (evt.bytesRead / fileSize) * 100;
            (process.stdout as any).write(
              `📈 Upload: ${progress.toFixed(2)}%\r`
            );
          },
        }
      );

      console.log("\n✅ Upload concluído!");
      console.log(
        "🔗 Link:",
        `https://youtube.com/watch?v=${response.data.id}`
      );

      await PublishedVideoModel.create({
        videoId: response.data.id,
        channelId: channelId || channel?.channelId || "",
        channelName: channel?.channelName || "",
        title: response.data.snippet?.title || title,
        description: response.data.snippet?.description || description,
        tags: tags,
        thumbnailUrl: response.data.snippet?.thumbnails?.high?.url || "",
        youtubeUrl: `https://youtube.com/watch?v=${response.data.id}`,
        publishedAt: new Date(),
      });

      return response.data;

    } catch (err: any) {
      if (err.message?.includes("invalid_grant")) {
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: "offline",
          scope: ["https://www.googleapis.com/auth/youtube.upload"],
          prompt: "consent",
        });
        console.warn("⚠️ Token expirado. Reautorize o canal:", authUrl);
        throw new Error(
          "O token do canal expirou. Autorize novamente pelo link acima."
        );
      }
      console.error("❌ Erro no upload:", err.response?.data || err.message);
      throw err;
    }
  }

  /**
   * Entrada do endpoint POST /youtube/upload: valida status/publishAt, publica e registra
   * a tentativa (sucesso ou erro) em PublishLog. Nada vai ao YouTube se a validação falhar.
   */
  static async publish(input: {
    videoPath: string;
    title: string;
    description: string;
    tags?: string[];
    status: unknown;
    publishAt?: unknown;
    channelId?: string;
    channelType?: string;
    channelLang?: string;
    refreshToken?: string;
    agentId?: string;
  }) {
    const log = {
      agentId: input.agentId,
      channelId: input.channelId,
      videoPath: input.videoPath,
      title: input.title,
      status: typeof input.status === "string" ? input.status : String(input.status),
      publishAt: undefined as Date | undefined,
    };

    try {
      const options = parsePublishOptions(input.status, input.publishAt);
      if (options.publishAt) log.publishAt = new Date(options.publishAt);

      const data = await this.uploadToYouTube(
        input.videoPath,
        input.title,
        input.description,
        input.tags || [],
        input.refreshToken,
        input.channelLang,
        undefined,
        undefined,
        input.channelId,
        input.channelType,
        options
      );

      const youtubeUrl = `https://youtube.com/watch?v=${data.id}`;
      await PublishLogModel.create({ ...log, result: "success", videoId: data.id, youtubeUrl });
      return { videoId: data.id as string, youtubeUrl, status: options.privacyStatus, publishAt: options.publishAt };
    } catch (err: any) {
      await PublishLogModel.create({ ...log, result: "error", error: err.message }).catch((logErr) =>
        console.error("❌ Falha ao gravar PublishLog:", logErr.message)
      );
      throw err;
    }
  }

  static listPublications(filter: { channelId?: string; result?: string }, limit = 50) {
    const query: Record<string, string> = {};
    if (filter.channelId) query.channelId = filter.channelId;
    if (filter.result) query.result = filter.result;
    return PublishLogModel.find(query).sort({ createdAt: -1 }).limit(Math.min(limit, 200)).lean();
  }
}