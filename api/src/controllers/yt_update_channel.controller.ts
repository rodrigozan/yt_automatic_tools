import { Request, Response } from "express";
import { YtUpdateChannelService } from "../services/yt_update_channel.service";

export class YtUpdateChannelController {
  static async updateChannel(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const { channelId } = req.params;
      const updateData = req.body;

      if (!email || !channelId) {
        return res
          .status(400)
          .json({ error: "Parâmetros 'email' e 'channelId' são obrigatórios." });
      }

      // Remove email from updateData to avoid trying to update it in the channel
      const { email: _, ...dataToUpdate } = updateData;

      const updatedChannel = await YtUpdateChannelService.updateChannel(
        String(email),
        String(channelId),
        dataToUpdate
      );

      res.status(200).json({
        message: "Canal atualizado com sucesso.",
        channel: updatedChannel,
      });
    } catch (err: any) {
      console.error("❌ Erro na atualização do canal:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
}
