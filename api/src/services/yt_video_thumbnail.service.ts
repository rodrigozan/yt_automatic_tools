import { Readable } from "stream";
import { YtCommentsError, YtCommentsService } from "./yt_comments.service";

export const THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;

function detectMime(buf: Buffer): "image/png" | "image/jpeg" | null {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  return null;
}

export class YtVideoThumbnailService {
  /** Define a thumbnail de um vídeo já enviado (thumbnails.set). */
  static async setThumbnail(channelId: string, videoId: string, file: Buffer) {
    if (file.length > THUMBNAIL_MAX_BYTES) throw new YtCommentsError("A thumbnail passa de 2 MB.", 413);
    const mimeType = detectMime(file);
    if (!mimeType) throw new YtCommentsError("A thumbnail precisa ser PNG ou JPG.", 400);

    const youtube = await YtCommentsService.getYoutubeClient(channelId);
    const current = await youtube.videos.list({ part: ["snippet"], id: [videoId] });
    const video = current.data.items?.[0];
    if (!video) throw new YtCommentsError("Vídeo não encontrado.", 404);
    if (video.snippet?.channelId !== channelId) {
      throw new YtCommentsError("O vídeo não pertence a esse canal.", 403);
    }

    try {
      const res = await youtube.thumbnails.set({
        videoId,
        media: { mimeType, body: Readable.from(file) },
      });
      const url = res.data.items?.[0]?.default?.url ?? null;
      return { videoId, bytes: file.length, mimeType, thumbnailUrl: url };
    } catch (err: any) {
      const code = err.response?.status ?? err.code;
      const reason = err.response?.data?.error?.message || err.message;
      if (code === 403 || code === 401) {
        throw new YtCommentsError(`O YouTube recusou a thumbnail: ${reason}. Canal sem permissão para thumbnail personalizada (verifique o canal em youtube.com/verify) ou token sem escopo.`, 403);
      }
      if (code === 400) throw new YtCommentsError(`O YouTube recusou a thumbnail: ${reason}`, 400);
      throw err;
    }
  }
}
