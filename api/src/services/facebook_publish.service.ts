import { graphPost } from "../utils/meta_graph_api.utils";

export class FacebookPublishService {
  /** Reels da Página, via upload por URL pública (fluxo start -> upload -> finish). */
  static async publishReel(
    pageId: string,
    pageAccessToken: string,
    videoUrl: string,
    description: string
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
      { upload_phase: "finish", video_id: videoId, video_state: "PUBLISHED", description },
      pageAccessToken
    );

    return { postId: videoId };
  }

  /** Vídeo padrão de feed da Página (não-Reel). */
  static async publishFeedVideo(
    pageId: string,
    pageAccessToken: string,
    videoUrl: string,
    description: string
  ): Promise<{ postId: string }> {
    const res = await graphPost(`/${pageId}/videos`, { file_url: videoUrl, description }, pageAccessToken);
    return { postId: res.id };
  }

  static async publishPhoto(
    pageId: string,
    pageAccessToken: string,
    imageUrl: string,
    caption: string
  ): Promise<{ postId: string }> {
    const res = await graphPost(`/${pageId}/photos`, { url: imageUrl, caption }, pageAccessToken);
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
}
