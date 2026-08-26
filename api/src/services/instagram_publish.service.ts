import { graphGet, graphPost } from "../utils/meta_graph_api.utils";

type ContainerStatus = "FINISHED" | "ERROR" | "EXPIRED";

export class InstagramPublishService {
  /**
   * Cria o container de mídia (etapa 1 do fluxo de publicação do Instagram).
   * Desde 2024 todo vídeo (feed ou Reel) usa media_type REELS; imagens usam IMAGE.
   * Instagram não tem post somente-texto.
   */
  static async createContainer(
    igUserId: string,
    pageAccessToken: string,
    opts: { mediaType: "REELS" | "IMAGE"; videoUrl?: string; imageUrl?: string; caption?: string }
  ): Promise<{ containerId: string }> {
    const body: Record<string, any> = { media_type: opts.mediaType, caption: opts.caption || "" };
    if (opts.mediaType === "REELS") body.video_url = opts.videoUrl;
    else body.image_url = opts.imageUrl;

    const res = await graphPost(`/${igUserId}/media`, body, pageAccessToken);
    return { containerId: res.id };
  }

  /** Containers expiram em 24h se nunca publicados; aqui damos um timeout curto de processamento. */
  static async pollContainerStatus(
    containerId: string,
    pageAccessToken: string,
    timeoutMs = 5 * 60 * 1000
  ): Promise<ContainerStatus> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const res = await graphGet(`/${containerId}`, { fields: "status_code" }, pageAccessToken);
      if (res.status_code === "FINISHED" || res.status_code === "ERROR" || res.status_code === "EXPIRED") {
        return res.status_code;
      }
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
    throw new Error("Tempo limite excedido aguardando processamento da mídia no Instagram.");
  }

  static async publish(igUserId: string, pageAccessToken: string, containerId: string): Promise<{ mediaId: string }> {
    const res = await graphPost(`/${igUserId}/media_publish`, { creation_id: containerId }, pageAccessToken);
    return { mediaId: res.id };
  }

  static async getPermalink(mediaId: string, pageAccessToken: string): Promise<string | undefined> {
    const res = await graphGet(`/${mediaId}`, { fields: "permalink" }, pageAccessToken);
    return res.permalink;
  }

  static async publishReel(
    igUserId: string,
    pageAccessToken: string,
    videoUrl: string,
    caption?: string
  ): Promise<{ mediaId: string }> {
    const { containerId } = await this.createContainer(igUserId, pageAccessToken, {
      mediaType: "REELS",
      videoUrl,
      caption,
    });
    const status = await this.pollContainerStatus(containerId, pageAccessToken);
    if (status !== "FINISHED") throw new Error(`Falha ao processar Reel no Instagram (status: ${status}).`);
    return this.publish(igUserId, pageAccessToken, containerId);
  }

  static async publishImage(
    igUserId: string,
    pageAccessToken: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ mediaId: string }> {
    const { containerId } = await this.createContainer(igUserId, pageAccessToken, {
      mediaType: "IMAGE",
      imageUrl,
      caption,
    });
    return this.publish(igUserId, pageAccessToken, containerId);
  }
}
