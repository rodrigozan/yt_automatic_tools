import { PublishedVideoModel } from "../models/published_video.model";

export class HistoryService {
  static async saveVideo(data: {
    videoId: string;
    channelId: string;
    channelName?: string;
    title?: string;
    description?: string;
    tags?: string[];
    thumbnailUrl?: string;
    youtubeUrl?: string;
    publishedAt?: Date;
  }) {
    const existing = await PublishedVideoModel.findOne({ videoId: data.videoId });
    if (existing) return existing;

    const video = new PublishedVideoModel(data);
    return video.save();
  }

  static async getVideosByChannel(channelId: string) {
    return PublishedVideoModel.find({ channelId })
      .sort({ publishedAt: -1 })
      .lean();
  }

  static async getVideosByUser(email: string) {
    const { User } = await import("../models/user.model");
    const user = await User.findOne({ email }).lean();
    if (!user) return [];

    if (user.role === "admin") {
      return PublishedVideoModel.find({}).sort({ publishedAt: -1 }).lean();
    }

    const channelIds = user.channels.map((c: any) => c.channelId);
    return PublishedVideoModel.find({ channelId: { $in: channelIds } })
      .sort({ publishedAt: -1 })
      .lean();
  }

  static async getVideoStats(videoId: string) {
    const { google } = await import("googleapis");
    const { User } = await import("../models/user.model");

    const video = await PublishedVideoModel.findOne({ videoId }).lean();
    if (!video) return null;

    const user = await User.findOne({ "channels.channelId": video.channelId }).lean();
    if (!user) return video;

    const channel = user.channels.find((c: any) => c.channelId === video.channelId);
    if (!channel?.refreshToken) return video;

    const oauth2Client = new (google.auth.OAuth2 as any)(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: channel.refreshToken });

    const youtube = google.youtube({ version: "v3", auth: oauth2Client });
    const response = await youtube.videos.list({
      part: ["statistics", "snippet"],
      id: [videoId],
    });

    const item = response.data.items?.[0];
    if (item) {
      video.viewCount = parseInt(item.statistics?.viewCount || "0");
      video.likeCount = parseInt(item.statistics?.likeCount || "0");
      video.commentCount = parseInt(item.statistics?.commentCount || "0");
      video.thumbnailUrl = item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || video.thumbnailUrl;
      video.title = item.snippet?.title;
      video.description = item.snippet?.description;
      video.publishedAt = item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : video.publishedAt;
      await PublishedVideoModel.updateOne({ videoId }, video);
    }

    return video;
  }

  static async refreshAllStats(email: string) {
    const videos = await this.getVideosByUser(email);
    const results = await Promise.allSettled(
      videos.map((v) => this.getVideoStats(v.videoId))
    );
    return { total: videos.length, updated: results.filter((r) => r.status === "fulfilled").length };
  }
}