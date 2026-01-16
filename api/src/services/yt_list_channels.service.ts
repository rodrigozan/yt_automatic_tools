import { User } from "../models/user.model";

export class YtListChannelsService {
  static async listAuthorizedChannels(email: string) {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Usuário não encontrado.");

    return user.channels.map((c) => ({
      channelId: c.channelId,
      channelName: c.channelName,
      channelNickname: c.channelNickname,
      channelPath: c.channelPath,
      channelGenre: c.channelGenre,
      channelType: c.channelType,
      refreshToken: c.refreshToken ? "✅ Active" : "❌ Missing",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }
}
