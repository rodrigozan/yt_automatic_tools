import mongoose from "mongoose";
import dotenv from "dotenv";
import { YtUpdateChannelService } from "../services/yt_update_channel.service";
import { MetadataService } from "../services/video_metadata_generator.service";
import { User } from "../models/user.model";

dotenv.config();

async function verify() {
  try {
    const dbUri = process.env.DB_URI || "mongodb://127.0.0.1:27017/yt-automatic-tools";
    console.log("Connecting to", dbUri);
    await mongoose.connect(dbUri);
    console.log("Connected to DB");

    const email = "rodzandonadi@gmail.com";
    const channelId = "UC6-6mYfOMBZLmm3dk4XFn0g";

    // Find user first to ensure it exists
    const user = await User.findOne({ email });
    if (!user) {
        console.log("User not found, creating a mock user for test...");
        await User.create({
            email,
            channels: [{
                channelId,
                channelName: "Test Channel",
                channelNickname: "@test",
                channelPath: "D:/Test",
                channelGenre: "LOFI",
                channelType: "music"
            }]
        });
    }

    // 1. Update channel
    console.log("Updating channel...");
    const updatedChannel = await YtUpdateChannelService.updateChannel(email, channelId, {
      instagramProfile: "https://instagram.com/neko_lofi",
      tiktokProfile: "https://tiktok.com/@neko_lofi",
      spotifyProfile: "https://spotify.com/neko",
      youtubeChannel: "https://youtube.com/neko"
    });
    console.log("Updated channel:", updatedChannel);

    // 2. Generate metadata
    console.log("Generating metadata...");
    const metadataService = new MetadataService();
    const result = await (metadataService as any).create({
      theme: "Lofi Vibes",
      niche: "Music",
      musicGenre: "Lofi",
      language: "Portuguese",
      timestampFile: "", // empty
      channelId: channelId
    });

    console.log("Generated Title:", result.generatedTitle);
    console.log("Generated Description:", result.generatedDescription);

    const hasInstagram = result.generatedDescription.includes("https://instagram.com/neko_lofi");
    const hasTikTok = result.generatedDescription.includes("https://tiktok.com/@neko_lofi");
    const hasSpotify = result.generatedDescription.includes("https://spotify.com/neko");
    const hasYouTube = result.generatedDescription.includes("https://youtube.com/neko");

    if (hasInstagram && hasTikTok && hasSpotify && hasYouTube) {
      console.log("✅ SUCCESS: Metadata includes all social links!");
    } else {
      console.log("❌ FAILURE: Metadata missing social links.");
      console.log("Results -> Instagram:", hasInstagram, "TikTok:", hasTikTok, "Spotify:", hasSpotify, "YouTube:", hasYouTube);
    }

  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
