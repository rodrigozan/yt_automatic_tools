import { Request, Response } from "express";

import { YtUploadVideoService } from "../services/yt_upload_video.service";
import { PublishValidationError } from "../utils/publish_options.utils";

export class YtUploadVideoController {
  public async upload(req: Request, res: Response) {
    try {
      const {
        videoDir,
        title,
        description,
        tags,
        channelLang,
        channelId,
        channelType,
        status,
        publishAt,
      } = req.body;

      if (!videoDir || !title || !description) {
        return res.status(400).json({
          error: "Campos obrigatórios ausentes: videoDir, title e description",
        });
      }

      const result = await YtUploadVideoService.publish({
        videoPath: videoDir,
        title,
        description,
        tags: Array.isArray(tags) ? tags : [],
        status,
        publishAt,
        channelId,
        channelType,
        channelLang,
        agentId: req.gladiadorYt?.agentId,
      });

      return res.status(200).json({
        message: "Upload concluído com sucesso!",
        videoId: result.videoId,
        link: result.youtubeUrl,
        status: result.status,
        publishAt: result.publishAt ?? null,
      });
    } catch (err: any) {
      const httpStatus = err instanceof PublishValidationError ? err.httpStatus : 500;
      if (httpStatus === 500) console.error("❌ Erro no upload:", err.message);
      return res.status(httpStatus).json({ error: err.message });
    }
  }

  public async listPublications(req: Request, res: Response) {
    try {
      const { channelId, result, limit } = req.query;
      const items = await YtUploadVideoService.listPublications(
        {
          channelId: typeof channelId === "string" ? channelId : undefined,
          result: result === "success" || result === "error" ? result : undefined,
        },
        Number(limit) > 0 ? Number(limit) : 50
      );
      return res.status(200).json({ items });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
