import fs from "fs";
import { google } from "googleapis";
import { config } from "dotenv";

/* --- Models --- */
import { User } from "../models/user.model";

/* --- Services  --- */
import { MetadataService } from "./video_metadata_generator.service";

/* --- Utils --- */
import { getStatus } from "../utils/get_status.utils";
import { detectChannelGenre } from "../utils/detect_channel_genre.utils";

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
      // generatedKeywords é uma string CSV — converte para array de tags
      tags = result.generatedKeywords
        ? result.generatedKeywords.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];
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
    channelType?: string
  ) {
    if (!fs.existsSync(videoPath))
      throw new Error(`Arquivo de vídeo não encontrado: ${videoPath}`);

    let channel: any = null;
    if (email && channelId) {
      const user = await User.findOne({ email });
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

    // 🩳 Shorts detection
    const isShort =
      channelType === "podcast_clip" ||
      channelType === "short" ||
      title.toLowerCase().includes("#short");
    if (isShort) {
      console.log(
        "🎞️ Detectado formato Shorts — aplicando regras especiais..."
      );
      if (!title.toLowerCase().includes("#shorts")) title += " #Shorts";
      description += "\n\n#Shorts";
    }

    const status = getStatus(isShort, publishAt);

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
}