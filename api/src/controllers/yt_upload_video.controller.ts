import { Request, Response } from "express";

import { YtUploadVideoService } from "../services/yt_upload_video.service";

export class YtUploadVideoController {
  public async upload(req: Request, res: Response) {
    try {
      const {
        videoDir,
        title,
        description,
        tags,
        chaptersFilePath,
        refreshToken,
        channelLang,
        publishAt,
      } = req.body;

      // 🔍 Validação simples — controller só valida o essencial
      if (!videoDir || !title || !description) {
        return res.status(400).json({
          error: "Campos obrigatórios ausentes: videoDir, title e description",
        });
      }

      // 🚀 Chama o serviço que faz TODO o trabalho pesado
      const result = await YtUploadVideoService.uploadWithAutoMetadata(
        videoDir,
        title,
        description,
        tags || [],
        chaptersFilePath,
        refreshToken,
        channelLang,
        publishAt
      );

      // 🎯 Controller apenas retorna o resultado
      return res.status(200).json({
        message: "✅ Upload concluído com sucesso!",
        videoId: result.id,
        link: `https://youtube.com/watch?v=${result.id}`,
      });
    } catch (err: any) {
      console.error("❌ Erro no upload:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }
}
