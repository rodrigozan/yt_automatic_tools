import { YtCommentsError, YtCommentsService } from "./yt_comments.service";

export class YtVideoSnippetService {
  static async update(channelId: string, videoId: string, input: any) {
    const keys = ["title", "description", "tags"];
    if (!input || !keys.some(key => input[key] !== undefined))
      throw new YtCommentsError("Envie title, description ou tags.", 400);
    if (input.title !== undefined && (typeof input.title !== "string" || !input.title.trim() || input.title.length > 100 || /[<>]/.test(input.title)))
      throw new YtCommentsError("title inválido (1 a 100 caracteres, sem < ou >).", 400);
    if (input.description !== undefined && (typeof input.description !== "string" || Buffer.byteLength(input.description, "utf8") > 5000 || /[<>]/.test(input.description)))
      throw new YtCommentsError("description inválida (até 5000 bytes, sem < ou >).", 400);
    if (input.tags !== undefined && (!Array.isArray(input.tags) || input.tags.some((tag: unknown) => typeof tag !== "string" || !tag.trim())))
      throw new YtCommentsError("tags deve ser uma lista de textos não vazios.", 400);
    const youtube = await YtCommentsService.getYoutubeClient(channelId);
    const read = async () => (await youtube.videos.list({ part: ["snippet", "status"], id: [videoId] })).data.items?.[0];
    const before = await read();
    if (!before) throw new YtCommentsError("Vídeo não encontrado.", 404);
    if (before.snippet?.channelId !== channelId) throw new YtCommentsError("O vídeo não pertence a esse canal.", 403);
    const old = before.snippet!;
    const snippet = {
      title: input.title ?? old.title,
      description: input.description ?? old.description,
      tags: input.tags ?? old.tags,
      categoryId: old.categoryId,
      defaultLanguage: old.defaultLanguage,
      defaultAudioLanguage: old.defaultAudioLanguage,
    };
    await youtube.videos.update({ part: ["snippet"], requestBody: { id: videoId, snippet } });
    let after;
    try { after = await read(); }
    catch { throw new YtCommentsError("Atualização enviada; leitura de confirmação falhou. Confira o vídeo antes de repetir.", 502); }
    if (!after) throw new YtCommentsError("Atualização enviada; vídeo ausente na confirmação.", 502);
    // YouTube may reorder tags; compare their contents without mutating either array.
    const normalize = (key: string, value: any) => key === "tags" ? [...(value ?? [])].sort() : value ?? "";
    const metadataVerified = keys.every(key => JSON.stringify(normalize(key, (after!.snippet as any)?.[key])) === JSON.stringify(normalize(key, (snippet as any)[key])));
    const statusPreserved = before.status?.privacyStatus === after.status?.privacyStatus && before.status?.publishAt === after.status?.publishAt;
    const result = { videoId, snippet: after.snippet, previousStatus: before.status, status: after.status, metadataVerified, statusPreserved, verified: metadataVerified && statusPreserved };
    if (!result.verified) throw Object.assign(new YtCommentsError("Atualização enviada, mas a conferência divergiu. Não repita automaticamente.", 502), { result });
    return result;
  }
}
