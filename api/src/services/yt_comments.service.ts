import { google } from "googleapis";
import { User } from "../models/user.model";
import { YtAuthorizeChannelsService } from "./yt_authorizate_channel.service";

export class YtCommentsError extends Error {
  constructor(message: string, public readonly httpStatus: number) {
    super(message);
    this.name = "YtCommentsError";
  }
}

export class YtCommentsService {
  static async getYoutubeClient(channelId: string) {
    const user = await User.findOne({ "channels.channelId": channelId });
    const channel = user?.channels.find((item) => item.channelId === channelId);

    if (!channel) {
      throw new YtCommentsError("Canal não encontrado.", 404);
    }

    if (
      !channel.refreshToken ||
      channel.refreshToken === "✅ Active" ||
      channel.refreshToken === "❌ Missing"
    ) {
      throw new YtCommentsError(
        "Canal sem refresh token válido. Reconecte o canal.",
        400
      );
    }

    return google.youtube({
      version: "v3",
      auth: YtAuthorizeChannelsService.createOAuthClient(channel.refreshToken),
    });
  }

  static async listComments(
    channelId: string,
    options: { maxResults: number; pageToken?: string }
  ) {
    const youtube = await this.getYoutubeClient(channelId);
    const response = await youtube.commentThreads.list({
      part: ["snippet", "replies"],
      allThreadsRelatedToChannelId: channelId,
      order: "time",
      maxResults: options.maxResults,
      pageToken: options.pageToken,
      textFormat: "plainText",
    });

    return {
      items: response.data.items ?? [],
      nextPageToken: response.data.nextPageToken ?? null,
      pageInfo: response.data.pageInfo ?? null,
    };
  }

  static async replyToComment(channelId: string, parentId: string, text: string) {
    const youtube = await this.getYoutubeClient(channelId);
    const response = await youtube.comments.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          parentId,
          textOriginal: text,
        },
      },
    });

    if (!response.data.id) {
      throw new Error("YouTube não retornou a resposta criada.");
    }

    return response.data;
  }
}
