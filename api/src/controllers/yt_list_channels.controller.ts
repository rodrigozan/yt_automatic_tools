import { Request, Response } from "express";

import { YtListChannelsService } from "../services/yt_list_channels.service";

export class YtListChannelsController {
  static async listAuthorizedChannels(req: Request, res: Response) {
    try {
      const { email } = req.query;
      if (!email) {
        return res
          .status(400)
          .json({ error: "Parâmetro 'email' é obrigatório." });
      }

      const channels = await YtListChannelsService.listAuthorizedChannels(
        String(email)
      );
      res.status(200).json({
        email,
        count: channels.length,
        channels,
      });
    } catch (err: any) {
      console.error("❌ Erro na listagem:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
}
