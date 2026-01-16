import { google } from "googleapis";
import { config } from "dotenv";

/* --- Utils --- */
import { detectChannelType } from "../utils/detect_channel_type.utils";
import { detectChannelGenre } from "../utils/detect_channel_genre.utils";

/* --- Models --- */
import { User } from "../models/user.model";

/* --- Services --- */
import { UserService } from "../services/user.service";

config();

export class YtAuthorizeChannelsService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI
    );
  }

  static loadOAuth2() {
    return new google.auth.OAuth2(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI
    );
  }

  static getAuthUrl(email?: string): string {
    const scopes = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ];

    const client = this.loadOAuth2();

    return client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state: email || undefined,
      redirect_uri: process.env.YT_REDIRECT_URI!,
    });
  }

  static async exchangeCodeForTokens(code: string) {
    console.log("YT_CLIENT_ID:", process.env.YT_CLIENT_ID);
    console.log("YT_REDIRECT_URI:", process.env.YT_REDIRECT_URI);
    console.log(
      "YT_CLIENT_SECRET:",
      process.env.YT_CLIENT_SECRET ? "✅ OK" : "❌ Missing"
    );

    const client = this.loadOAuth2();
    console.log("OAuth2", client);
    const { tokens } = await client.getToken({
      code,
      redirect_uri: process.env.YT_REDIRECT_URI!,
    });
    return tokens;
  }

  static createOAuthClient(refreshToken: string) {
    const client = new google.auth.OAuth2(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI
    );
    client.setCredentials({ refresh_token: refreshToken });
    return client;
  }

  static async handleOAuthCallback(code: string, email: string) {
    console.log("🔁 Iniciando troca de código por tokens...");
    const tokens = await YtAuthorizeChannelsService.exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      throw new Error(
        "❌ Nenhum refresh_token retornado. Revogue o app e tente novamente."
      );
    }

    const oauth2Client = YtAuthorizeChannelsService.createOAuthClient(
      tokens.refresh_token!
    );
    const youtube = google.youtube({ version: "v3", auth: oauth2Client });

    console.log("📡 Buscando informações do canal...");
    const me = await youtube.channels.list({ part: ["snippet", "contentDetails"], mine: true });
    const channel = me.data.items?.[0];

    if (!channel) {
      throw new Error("❌ Canal não identificado.");
    }

    const channelId = channel.id!;
    const channelName = channel.snippet?.title || "Canal sem nome";
    const handle =
      channel.snippet?.customUrl ||
      channelName.toLowerCase().replace(/\s+/g, "");
    const channelLang = channel.snippet?.defaultLanguage || channel.snippet?.country || "Não definido";
    const channelGenre = detectChannelGenre(channelName);
    const refreshToken = tokens.refresh_token;

    console.log(`📺 Canal detectado: ${channelName} (${channelId})`);

    // 🧩 Busca o usuário
    const userService = new UserService();
    const user = await userService.findOrCreate(email);

    // 🧱 Configurações padrão

    const baseDir = "D:/YT Channels";
    const channelType = detectChannelType(channelName);
    const path = `${baseDir}/${channelType}/${channelName}`;

    // 🧠 Verifica se o canal já existe
    const existingChannelIndex = user.channels.findIndex(
      (c: any) => c.channelId === channelId
    );

    if (existingChannelIndex !== -1) {
      // 🔄 Atualiza canal existente
      const existingChannel = user.channels[existingChannelIndex];
      existingChannel.refreshToken = refreshToken;
      existingChannel.updatedAt = new Date();

      console.log(`🔄 Canal existente atualizado: ${channelName}`);
    } else {
      // ➕ Novo canal com configs padrão
      user.channels.push({
        channelId: channelId,
        channelName: channelName,
        channelNickname: handle,
        channelPath: path,
        channelLang: channelLang,
        channelGenre: channelGenre,
        channelType: channelType,
        refreshToken: refreshToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`🆕 Novo canal adicionado: ${channelName}`);
    }

    // 💾 Salva alterações
    await user.save();

    console.log("✅ Canal conectado/atualizado com sucesso!");
    return { channelId, channelName, refreshToken };
  }
}
