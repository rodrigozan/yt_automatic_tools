import { Request, Response } from "express";
import { YtCommentsError, YtCommentsService } from "../services/yt_comments.service";

export class YtCommentsController {
  static async list(req: Request, res: Response) {
    const { channelId, maxResults, pageToken } = req.query;
    if (typeof channelId !== "string" || !channelId.trim()) {
      return res.status(400).json({ error: "O parâmetro channelId é obrigatório." });
    }

    const parsedMaxResults = maxResults === undefined ? 50 : Number(maxResults);
    if (
      !Number.isInteger(parsedMaxResults) ||
      parsedMaxResults < 1 ||
      parsedMaxResults > 100
    ) {
      return res.status(400).json({ error: "maxResults deve ser um inteiro entre 1 e 100." });
    }
    if (pageToken !== undefined && typeof pageToken !== "string") {
      return res.status(400).json({ error: "pageToken inválido." });
    }

    try {
      const result = await YtCommentsService.listComments(channelId, {
        maxResults: parsedMaxResults,
        pageToken,
      });
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof YtCommentsError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      console.error("Erro ao listar comentários do YouTube:", error);
      return res.status(500).json({ error: "Erro ao listar comentários do YouTube." });
    }
  }

  static async reply(req: Request, res: Response) {
    const { channelId, parentId, text } = req.body ?? {};
    if (
      typeof channelId !== "string" ||
      !channelId.trim() ||
      typeof parentId !== "string" ||
      !parentId.trim() ||
      typeof text !== "string" ||
      !text.trim()
    ) {
      return res.status(400).json({
        error: "Os campos channelId, parentId e text são obrigatórios.",
      });
    }
    if (text.trim().length > 10000) {
      return res.status(400).json({ error: "text deve ter no máximo 10000 caracteres." });
    }

    try {
      const comment = await YtCommentsService.replyToComment(
        channelId,
        parentId,
        text.trim()
      );
      return res.status(201).json({ comment });
    } catch (error) {
      if (error instanceof YtCommentsError) {
        return res.status(error.httpStatus).json({ error: error.message });
      }
      console.error("Erro ao responder comentário no YouTube:", error);
      return res.status(500).json({ error: "Erro ao responder comentário no YouTube." });
    }
  }
}
