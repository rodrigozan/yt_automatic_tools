import { config } from "dotenv";
import { User } from "../models/user.model";
import { graphGet } from "../utils/meta_graph_api.utils";

config();

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

export interface MetaPage {
  id: string;
  name: string;
  access_token: string;
}

export class MetaAuthorizeChannelService {
  static encodeState(email: string, channelId: string): string {
    return Buffer.from(JSON.stringify({ email, channelId })).toString("base64url");
  }

  static decodeState(state: string): { email: string; channelId: string } {
    return JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
  }

  static getAuthUrl(email: string, channelId: string): string {
    const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set("client_id", process.env.META_CLIENT_ID || "");
    url.searchParams.set("redirect_uri", process.env.META_REDIRECT_URI || "");
    url.searchParams.set("state", this.encodeState(email, channelId));
    url.searchParams.set("scope", META_SCOPES);
    url.searchParams.set("response_type", "code");
    return url.toString();
  }

  static async exchangeCodeForUserToken(code: string): Promise<{ access_token: string; expires_in?: number }> {
    return graphGet("/oauth/access_token", {
      client_id: process.env.META_CLIENT_ID || "",
      client_secret: process.env.META_CLIENT_SECRET || "",
      redirect_uri: process.env.META_REDIRECT_URI || "",
      code,
    });
  }

  static async exchangeForLongLivedUserToken(shortLivedToken: string): Promise<{ access_token: string; expires_in?: number }> {
    return graphGet("/oauth/access_token", {
      grant_type: "fb_exchange_token",
      client_id: process.env.META_CLIENT_ID || "",
      client_secret: process.env.META_CLIENT_SECRET || "",
      fb_exchange_token: shortLivedToken,
    });
  }

  static async getMetaUserId(userAccessToken: string): Promise<string> {
    const res = await graphGet("/me", { fields: "id" }, userAccessToken);
    return res.id;
  }

  static async listUserPages(userAccessToken: string): Promise<MetaPage[]> {
    const res = await graphGet("/me/accounts", { fields: "id,name,access_token" }, userAccessToken);
    return res.data || [];
  }

  static async resolveInstagramBusinessAccount(
    pageId: string,
    pageAccessToken: string
  ): Promise<{ igUserId: string; igUsername: string } | null> {
    const res = await graphGet(`/${pageId}`, { fields: "instagram_business_account{id,username}" }, pageAccessToken);
    if (!res.instagram_business_account) return null;
    return {
      igUserId: res.instagram_business_account.id,
      igUsername: res.instagram_business_account.username,
    };
  }

  /**
   * Anexa a conexão Facebook/Instagram a um canal já existente (criado via
   * OAuth do YouTube) — não cria canais novos.
   */
  static async savePageConnection(email: string, channelId: string, page: MetaPage, metaUserId: string): Promise<void> {
    const requester = await User.findOne({ email });
    const isAdmin = requester?.role === "admin";

    const user = isAdmin
      ? await User.findOne({ "channels.channelId": channelId })
      : await User.findOne({ email, "channels.channelId": channelId });

    if (!user) throw new Error("Usuário ou canal não encontrado.");

    const channel: any = user.channels.find((c: any) => c.channelId === channelId);
    if (!channel) throw new Error("Canal não encontrado.");

    const igAccount = await this.resolveInstagramBusinessAccount(page.id, page.access_token).catch(() => null);

    channel.meta = {
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      metaUserId,
      igUserId: igAccount?.igUserId,
      igUsername: igAccount?.igUsername,
      connectedAt: channel.meta?.connectedAt || new Date(),
      updatedAt: new Date(),
    };
    channel.updatedAt = new Date();

    await user.save();
  }
}
