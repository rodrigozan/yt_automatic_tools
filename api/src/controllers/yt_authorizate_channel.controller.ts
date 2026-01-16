import { Request, Response } from "express";

import { YtAuthorizeChannelsService } from "../services/yt_authorizate_channel.service";

export class YtAuthorizeChannelsController {
  static async auth(req: Request, res: Response) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).send("❌ Parâmetro 'email' é obrigatório.");
      }

      const url = YtAuthorizeChannelsService.getAuthUrl(String(email)) || "";
      return res.redirect(await url);
    } catch (err: any) {
      console.error("❌ Erro ao gerar URL de autenticação:", err.message);
      res.status(500).send("Erro ao gerar URL de autenticação.");
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
}
