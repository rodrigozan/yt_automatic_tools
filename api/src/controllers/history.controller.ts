import { Request, Response } from "express";
import { HistoryService } from "../services/history.service";

export class HistoryController {
  static async getVideos(req: Request, res: Response) {
    try {
      const { email, channelId } = req.query;

      if (!email) {
        return res.status(400).json({ error: "email é obrigatório" });
      }

      let videos;
      if (channelId) {
        videos = await HistoryService.getVideosByChannel(String(channelId));
      } else {
        videos = await HistoryService.getVideosByUser(String(email));
      }

      return res.json({ videos });
    } catch (err: any) {
      console.error("❌ Erro ao buscar histórico:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  static async refreshStats(req: Request, res: Response) {
    try {
      const { email, videoId } = req.body;

      if (!email) {
        return res.status(400).json({ error: "email é obrigatório" });
      }

      if (videoId) {
        const video = await HistoryService.getVideoStats(videoId);
        return res.json({ video });
      }

      const result = await HistoryService.refreshAllStats(email);
      return res.json(result);
    } catch (err: any) {
      console.error("❌ Erro ao atualizar estatísticas:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  static async getVideo(req: Request, res: Response) {
    try {
      const { videoId } = req.params;
      const video = await HistoryService.getVideoStats(String(videoId));
      if (!video) return res.status(404).json({ error: "Vídeo não encontrado" });
      return res.json({ video });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}