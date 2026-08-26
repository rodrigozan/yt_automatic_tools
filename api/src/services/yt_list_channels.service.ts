import { User } from "../models/user.model";

export class YtListChannelsService {
  static async listAuthorizedChannels(email: string) {
    const requester = await User.findOne({ email });
    if (!requester) throw new Error("Usuário não encontrado.");

    const mapChannel = (c: any, ownerEmail: string) => ({
      channelId: c.channelId,
      channelName: c.channelName,
      channelNickname: c.channelNickname,
      channelPath: c.channelPath,
      channelGenre: c.channelGenre,
      channelType: c.channelType,
      refreshToken: c.refreshToken ? "✅ Active" : "❌ Missing",
      spotifyProfile: c.spotifyProfile || null,
      youtubeChannel: c.youtubeChannel || null,
      facebookConnected: Boolean(c.meta?.pageId),
      facebookPageName: c.meta?.pageName || null,
      instagramConnected: Boolean(c.meta?.igUserId),
      instagramUsername: c.meta?.igUsername || null,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      ownerEmail,
    });

    if (requester.role === "admin") {
      const allUsers = await User.find({});
      return allUsers.flatMap((u) => u.channels.map((c) => mapChannel(c, u.email)));
    }

    return requester.channels.map((c) => mapChannel(c, requester.email));
  }
}
