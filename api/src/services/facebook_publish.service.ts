import { graphPost } from "../utils/meta_graph_api.utils";

export class FacebookPublishService {
  /** Reels da Página, via upload por URL pública (fluxo start -> upload -> finish). */
  static async publishReel(
    pageId: string,
    pageAccessToken: string,
    videoUrl: string,
    description: string,
    scheduledAt?: number
  ): Promise<{ postId: string }> {
    const start = await graphPost(`/${pageId}/video_reels`, { upload_phase: "start" }, pageAccessToken);
    const videoId = start.video_id;
    const uploadUrl = start.upload_url;

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${pageAccessToken}`,
        file_url: videoUrl,
      },
    });
    if (!uploadRes.ok) {
      throw new Error(`Falha ao enviar vídeo do Reel para o Facebook (status ${uploadRes.status}).`);
    }

    await graphPost(
      `/${pageId}/video_reels`,
      scheduledAt
        ? { upload_phase: "finish", video_id: videoId, video_state: "SCHEDULED", scheduled_publish_time: scheduledAt, description }
        : { upload_phase: "finish", video_id: videoId, video_state: "PUBLISHED", description },
      pageAccessToken
    );

    return { postId: videoId };
  }

  /** Vídeo padrão de feed da Página (não-Reel). */
  static async publishFeedVideo(
    pageId: string,
    pageAccessToken: string,
    videoUrl: string,
    description: string,
    scheduledAt?: number
  ): Promise<{ postId: string }> {
    const res = await graphPost(
      `/${pageId}/videos`,
      scheduledAt
        ? { file_url: videoUrl, description, published: false, scheduled_publish_time: scheduledAt }
        : { file_url: videoUrl, description },
      pageAccessToken
    );
    return { postId: res.id };
  }

  static async publishPhoto(
    pageId: string,
    pageAccessToken: string,
    imageUrl: string,
    caption: string,
    scheduledAt?: number
  ): Promise<{ postId: string }> {
    const res = await graphPost(
      `/${pageId}/photos`,
      scheduledAt
        ? { url: imageUrl, caption, published: false, scheduled_publish_time: scheduledAt }
        : { url: imageUrl, caption },
      pageAccessToken
    );
    return { postId: res.post_id || res.id };
  }

  static async publishTextPost(
    pageId: string,
    pageAccessToken: string,
    message: string
  ): Promise<{ postId: string }> {
    const res = await graphPost(`/${pageId}/feed`, { message }, pageAccessToken);
    return { postId: res.id };
  }

  /**
   * Carrossel de fotos da Página: cada foto sobe sem publicar e um único post as reúne via attached_media.
   * Com `scheduledAt` (segundos Unix) o post fica agendado em vez de sair na hora.
   */
  static async publishPhotoAlbum(
    pageId: string,
    pageAccessToken: string,
    imageUrls: string[],
    caption: string,
    scheduledAt?: number
  ): Promise<{ postId: string }> {
    if (imageUrls.length < 2) throw new Error("Carrossel do Facebook precisa de pelo menos 2 imagens.");
    if (imageUrls.length > 10) throw new Error("Carrossel do Facebook aceita no máximo 10 imagens.");
    const attached: { media_fbid: string }[] = [];
    for (const url of imageUrls) {
      const photo = await graphPost(`/${pageId}/photos`, { url, published: false }, pageAccessToken);
      attached.push({ media_fbid: photo.id });
    }
    const body: Record<string, any> = { message: caption, attached_media: attached };
    if (scheduledAt) {
      body.published = false;
      body.scheduled_publish_time = scheduledAt;
    }
    const res = await graphPost(`/${pageId}/feed`, body, pageAccessToken);
    return { postId: res.id };
  }
}
