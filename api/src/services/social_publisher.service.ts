import { User } from "../models/user.model";
import { YtUploadVideoService } from "./yt_upload_video.service";
import { GDrivePublishUploadService, DrivePublicUpload } from "./gdrive_publish_upload.service";
import { FacebookPublishService } from "./facebook_publish.service";
import { InstagramPublishService } from "./instagram_publish.service";
import { isShortFormContent } from "../utils/is_short_form_content.utils";

export type PublishPlatform = "youtube" | "facebook" | "instagram";
export type PublishContentType = "video" | "image" | "text";

export interface PublishInput {
  email: string;
  channelId: string;
  channelType?: string;
  platforms: PublishPlatform[];
  contentType: PublishContentType;
  isShortForm?: boolean;
  mediaPath?: string;
  chaptersFilePath?: string;
  caption?: string;
  theme?: string;
  channelLang?: string;
  niche?: string;
  musicGenre?: string;
  forceStyle?: "christian" | "secular";
  refreshToken?: string;
}

export interface PublishResult {
  platform: PublishPlatform;
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
  skippedReason?: string;
}

const MIME_BY_CONTENT: Record<"video" | "image", string> = {
  video: "video/mp4",
  image: "image/jpeg",
};

export class SocialPublisherService {
  static async publish(input: PublishInput): Promise<PublishResult[]> {
    const { email, channelId, platforms } = input;

    const user =
      (await User.findOne({ email, "channels.channelId": channelId })) ||
      (await User.findOne({ "channels.channelId": channelId }));
    const channel: any = user?.channels.find((c: any) => c.channelId === channelId);

    const results: PublishResult[] = [];

    const wantsYoutube = platforms.includes("youtube");
    const wantsFacebook = platforms.includes("facebook");
    const wantsInstagram = platforms.includes("instagram");

    const driveRefreshToken: string | undefined = channel?.refreshToken;
    let driveUpload: DrivePublicUpload | null = null;

    const ensurePublicUrl = async (): Promise<string> => {
      if (driveUpload) return driveUpload.publicUrl;
      if (!input.mediaPath) throw new Error("mediaPath é obrigatório para publicar vídeo/imagem.");
      if (!driveRefreshToken) {
        throw new Error("Canal sem refreshToken do Google — não é possível hospedar o arquivo publicamente no Drive.");
      }
      const mimeType = MIME_BY_CONTENT[input.contentType as "video" | "image"];
      driveUpload = await GDrivePublishUploadService.uploadPublicFile(input.mediaPath, driveRefreshToken, mimeType);
      return driveUpload.publicUrl;
    };

    if (wantsYoutube) {
      try {
        const uploadResult: any = await YtUploadVideoService.uploadWithAutoMetadata(
          input.mediaPath!,
          input.chaptersFilePath!,
          input.theme || "",
          email,
          channelId,
          input.channelType || "default",
          input.refreshToken,
          input.channelLang,
          input.forceStyle,
          input.niche,
          input.musicGenre
        );
        results.push({
          platform: "youtube",
          success: true,
          postId: uploadResult?.id || undefined,
          url: uploadResult?.id ? `https://youtube.com/watch?v=${uploadResult.id}` : undefined,
        });
      } catch (error: any) {
        results.push({ platform: "youtube", success: false, error: error.message });
      }
    }

    if (wantsFacebook || wantsInstagram) {
      const pageAccessToken: string | undefined = channel?.meta?.pageAccessToken;
      const pageId: string | undefined = channel?.meta?.pageId;
      const igUserId: string | undefined = channel?.meta?.igUserId;
      const shortForm = isShortFormContent({
        channelType: input.channelType,
        title: input.theme,
        explicitOverride: input.isShortForm,
      });
      const caption = input.caption || input.theme || "";

      if (wantsFacebook) {
        if (!pageAccessToken || !pageId) {
          results.push({
            platform: "facebook",
            success: false,
            skippedReason: "Página do Facebook não conectada para este canal.",
          });
        } else {
          try {
            let postId: string;
            if (input.contentType === "text") {
              ({ postId } = await FacebookPublishService.publishTextPost(pageId, pageAccessToken, caption));
            } else if (input.contentType === "image") {
              const publicUrl = await ensurePublicUrl();
              ({ postId } = await FacebookPublishService.publishPhoto(pageId, pageAccessToken, publicUrl, caption));
            } else {
              const publicUrl = await ensurePublicUrl();
              ({ postId } = shortForm
                ? await FacebookPublishService.publishReel(pageId, pageAccessToken, publicUrl, caption)
                : await FacebookPublishService.publishFeedVideo(pageId, pageAccessToken, publicUrl, caption));
            }
            results.push({ platform: "facebook", success: true, postId, url: `https://facebook.com/${postId}` });
          } catch (error: any) {
            results.push({ platform: "facebook", success: false, error: error.message });
          }
        }
      }

      if (wantsInstagram) {
        if (!pageAccessToken || !igUserId) {
          results.push({
            platform: "instagram",
            success: false,
            skippedReason: "Conta do Instagram Business não conectada para este canal.",
          });
        } else if (input.contentType === "text") {
          results.push({
            platform: "instagram",
            success: false,
            skippedReason: "Instagram não suporta posts somente-texto.",
          });
        } else {
          try {
            const publicUrl = await ensurePublicUrl();
            const result = input.contentType === "image"
              ? await InstagramPublishService.publishImage(igUserId, pageAccessToken, publicUrl, caption)
              : await InstagramPublishService.publishReel(igUserId, pageAccessToken, publicUrl, caption);
            const permalink = await InstagramPublishService.getPermalink(result.mediaId, pageAccessToken).catch(
              () => undefined
            );
            results.push({ platform: "instagram", success: true, postId: result.mediaId, url: permalink });
          } catch (error: any) {
            results.push({ platform: "instagram", success: false, error: error.message });
          }
        }
      }
    }

    if (driveUpload && driveRefreshToken) {
      await GDrivePublishUploadService.deleteFile((driveUpload as DrivePublicUpload).fileId, driveRefreshToken);
    }

    return results;
  }
}
