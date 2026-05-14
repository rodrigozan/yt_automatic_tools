import { Request, Response } from "express";
import { google } from "googleapis";
import { YtAuthorizeChannelsService } from "../services/yt_authorizate_channel.service";
import { UserService } from "../services/user.service";

export class YtAuthorizeChannelsController {
  static async auth(req: Request, res: Response) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: "❌ Parâmetro 'email' é obrigatório." });
      }

      const url = YtAuthorizeChannelsService.getAuthUrl(String(email));
      if (req.headers.accept?.includes('application/json') || req.xhr) {
        return res.json({ url });
      }
      return res.redirect(url);
    } catch (err: any) {
      console.error("❌ Erro ao gerar URL de autenticação:", err.message);
      res.status(500).json({ error: "Erro ao gerar URL de autenticação." });
    }
  }

  static async callback(req: Request, res: Response) {
    const code = req.query.code as string;
    const email = req.query.state
      ? decodeURIComponent(req.query.state as string)
      : undefined;

    if (!code || !email) {
      return res.status(400).send("Código ou e-mail ausente.");
    }

    console.log("Code: ", code, "; Email: ", email);

    try {
      const channelData = await YtAuthorizeChannelsService.handleOAuthCallback(
        code,
        email
      );

      console.log("Channel Data", channelData);

      return res.send(`
        <h2>✅ Canal "${channelData.channelName}" conectado com sucesso!</h2>
        <p>Refresh token salvo no banco.</p>
        <pre>${JSON.stringify(channelData, null, 2)}</pre>
      `);
    } catch (err: any) {
      console.error("❌ Erro no callback:", err.message);
      return res.status(500).send("Erro ao processar autenticação.");
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { channelId, email } = req.body;

      if (!channelId || !email) {
        return res.status(400).json({ error: "channelId e email são obrigatórios." });
      }

      const userService = new UserService();
      const user = await userService.findByEmail(email);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const channel = user.channels.find((c: any) => c.channelId === channelId);

      if (!channel) {
        return res.status(404).json({ error: "Canal não encontrado." });
      }

      const refreshToken = channel.refreshToken;

      if (!refreshToken || refreshToken === "✅ Active" || refreshToken === "") {
        return res.status(400).json({
          error: "Canal não possui refresh token válido. Reconecte o canal.",
          needsReconnect: true,
        });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.YT_CLIENT_ID,
        process.env.YT_CLIENT_SECRET,
        process.env.YT_REDIRECT_URI
      );

      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await oauth2Client.refreshAccessToken();

      const youtube = google.youtube({ version: "v3", auth: oauth2Client });
      await youtube.channels.list({ part: ["snippet", "contentDetails"], mine: true });

      if (credentials.refresh_token) {
        channel.refreshToken = credentials.refresh_token;
      }

      channel.updatedAt = new Date();
      await user.save();

      return res.json({
        success: true,
        message: "Token atualizado com sucesso!",
        expiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date).toISOString()
          : null,
      });
    } catch (err: any) {
      console.error("❌ Erro ao atualizar token:", err.message);

      if (err.message?.includes("invalid_grant") || err.message?.includes("Token has been revoked")) {
        return res.status(401).json({
          error: "Token expirado ou revogado. Reconecte o canal.",
          needsReconnect: true,
        });
      }

      return res.status(500).json({ error: "Erro ao atualizar token: " + err.message });
    }
  }
}