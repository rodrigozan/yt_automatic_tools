import fs from "fs";
import { google } from "googleapis";
import { config } from "dotenv";

/* --- Models --- */
import { User } from "../models/user.model";

/* --- Services  --- */
import { YtMetadataService } from "./yt_metadata.service";

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
    forceStyle?: "christian" | "secular"
  ) {
    if (!fs.existsSync(chaptersFilePath)) throw new Error("Capítulos não encontrados");
    const chaptersContent = fs.readFileSync(chaptersFilePath, "utf-8");

    // 1. Define o ESTILO (Tone) para a IA
    let style: "christian" | "secular" = "secular"; // fallback

    if (forceStyle) {
      style = forceStyle;
    } else {
      // Tenta detectar pelo tema ou busca o nome do canal no banco
      // Aqui estou usando o tema pra simplificar, mas você pode pegar o nome do canal do objeto user
      style = detectChannelGenre(theme);
    }

    console.log(`🤖 Gerando metadados... | Tipo YT: ${channelType} | Estilo IA: ${style.toUpperCase()}`);

    // 2. Chama a IA com o estilo correto
    const metadata = await YtMetadataService.generateFromChapters(
      theme,
      style,
      chaptersContent
    );

    console.log(`✨ Título: ${metadata.title}`);

    // 3. Faz o Upload (passando o channelType correto para a categoria)
    return this.uploadToYouTube(
      videoPath,
      metadata.title,
      metadata.description,
      metadata.tags,
      refreshToken,
      channelLang,
      undefined,
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
    oauth2Client.setCredentials({
      refresh_token: refreshToken || process.env.YT_REFRESH_TOKEN,
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

    const status = getStatus(isShort);

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