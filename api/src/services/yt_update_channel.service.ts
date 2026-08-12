import { User } from "../models/user.model";
import { IChannel } from "../interfaces/global.interface";

export class YtUpdateChannelService {
  static async updateChannel(email: string, channelId: string, updateData: Partial<IChannel>) {
    const requester = await (User as any).findOne({ email });
    const isAdmin = requester?.role === "admin";

    const user = isAdmin
      ? await (User as any).findOne({ "channels.channelId": channelId })
      : await (User as any).findOne({ email, "channels.channelId": channelId });

    if (!user) {
      throw new Error("Usuário ou canal não encontrado.");
    }

    const channel = user.channels.find((c: any) => c.channelId === channelId);
    if (!channel) {
      throw new Error("Canal não encontrado no usuário.");
    }

    // Update fields
    if (updateData.channelName) channel.channelName = updateData.channelName;
    if (updateData.channelNickname) channel.channelNickname = updateData.channelNickname;
    if (updateData.channelPath) channel.channelPath = updateData.channelPath;
    if (updateData.channelGenre) channel.channelGenre = updateData.channelGenre;
    if (updateData.channelType) channel.channelType = updateData.channelType;
    if (updateData.spotifyProfile) channel.spotifyProfile = updateData.spotifyProfile;
    if (updateData.youtubeChannel) channel.youtubeChannel = updateData.youtubeChannel;
    if (updateData.instagramProfile) channel.instagramProfile = updateData.instagramProfile;
    if (updateData.tiktokProfile) channel.tiktokProfile = updateData.tiktokProfile;
    
    channel.updatedAt = new Date();
    user.updatedAt = new Date();

    await user.save();

    return channel;
  }
}
