import { YtCommentsError, YtCommentsService } from "./yt_comments.service";
import { parsePublishOptions } from "../utils/publish_options.utils";

export class YtVideoVisibilityService {
  /** Muda o privacyStatus de um vídeo já enviado, preservando o resto do bloco status. */
  static async setVisibility(channelId: string, videoId: string, rawStatus: unknown) {
    const { privacyStatus } = parsePublishOptions(rawStatus, undefined);
    const youtube = await YtCommentsService.getYoutubeClient(channelId);

    const current = await youtube.videos.list({ part: ["snippet", "status"], id: [videoId] });
    const video = current.data.items?.[0];
    if (!video) throw new YtCommentsError("Vídeo não encontrado.", 404);
    if (video.snippet?.channelId !== channelId) {
      throw new YtCommentsError("O vídeo não pertence a esse canal.", 403);
    }

    const previous = video.status?.privacyStatus ?? null;
    if (previous === privacyStatus) return { videoId, previous, status: privacyStatus, changed: false };

    const status = { ...video.status, privacyStatus };
    delete (status as any).publishAt; // publishAt só vale com private
    await youtube.videos.update({ part: ["status"], requestBody: { id: videoId, status } });

    return { videoId, previous, status: privacyStatus, changed: true };
  }
}
