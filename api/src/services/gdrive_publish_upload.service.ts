import fs from "fs";
import path from "path";
import { google } from "googleapis";
import { config } from "dotenv";

config();

export interface DrivePublicUpload {
  fileId: string;
  publicUrl: string;
}

export class GDrivePublishUploadService {
  private static buildOAuthClient(refreshToken: string) {
    const client = new google.auth.OAuth2(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI
    );
    client.setCredentials({ refresh_token: refreshToken });
    return client;
  }

  /**
   * Sobe um arquivo local para o Drive do dono do canal (via refreshToken já usado
   * para YouTube, com o escopo drive.file adicional) e o torna publicamente
   * acessível — necessário porque a Graph API do Meta exige uma URL pública,
   * diferente do upload resumível do YouTube.
   */
  static async uploadPublicFile(
    localFilePath: string,
    refreshToken: string,
    mimeType: string,
    fileName?: string
  ): Promise<DrivePublicUpload> {
    const auth = this.buildOAuthClient(refreshToken);
    const drive = google.drive({ version: "v3", auth });

    const { data } = await drive.files.create({
      requestBody: { name: fileName || path.basename(localFilePath) },
      media: { mimeType, body: fs.createReadStream(localFilePath) },
      fields: "id",
    });

    const fileId = data.id;
    if (!fileId) throw new Error("Falha ao obter o ID do arquivo enviado ao Drive.");

    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });

    // `confirm=t` evita a página de confirmação de vírus do Drive, que quebra
    // fetchers automatizados como o do Meta para arquivos maiores.
    const publicUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;

    return { fileId, publicUrl };
  }

  static async deleteFile(fileId: string, refreshToken: string): Promise<void> {
    const auth = this.buildOAuthClient(refreshToken);
    const drive = google.drive({ version: "v3", auth });
    await drive.files.delete({ fileId }).catch((err) => {
      console.warn(`⚠️ Falha ao remover arquivo público do Drive (${fileId}):`, err.message);
    });
  }
}
