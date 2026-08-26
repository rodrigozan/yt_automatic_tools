import { Request, Response } from "express";
import { SocialPublisherService, PublishInput } from "../services/social_publisher.service";

export class SocialPublisherController {
  static publish = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        email,
        channelId,
        channelType,
        platforms,
        contentType,
        isShortForm,
        mediaPath,
        chaptersFilePath,
        caption,
        theme,
        channelLang,
        niche,
        musicGenre,
        forceStyle,
        refreshToken,
      } = req.body;

      if (!email || !channelId || !Array.isArray(platforms) || platforms.length === 0 || !contentType) {
        res.status(400).json({
          error: "Parâmetros obrigatórios: email, channelId, platforms (array não vazio), contentType.",
        });
        return;
      }

      const input: PublishInput = {
        email,
        channelId,
        channelType,
        platforms,
        contentType,
        isShortForm,
        mediaPath,
        chaptersFilePath,
        caption,
        theme,
        channelLang,
        niche,
        musicGenre,
        forceStyle,
        refreshToken,
      };

      const results = await SocialPublisherService.publish(input);
      res.status(200).json({ results });
    } catch (error: any) {
      console.error("❌ Erro ao publicar conteúdo:", error);
      res.status(500).json({ error: "Falha ao publicar conteúdo.", details: error.message });
    }
  };
}
