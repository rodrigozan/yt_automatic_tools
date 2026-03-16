import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';

export class FileUploadController {

    /**
     * Handles standard multipart/form-data file uploads via Multer
     */
    public uploadLocal = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.file) {
                res.status(400).json({ error: 'Nenhum arquivo enviado.' });
                return;
            }

            // Return the absolute path on the server
            const absolutePath = path.resolve(req.file.path);

            res.status(200).json({
                message: 'Arquivo enviado com sucesso.',
                filePath: absolutePath,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
            });
        } catch (error: any) {
            console.error('❌ Erro no upload local:', error);
            res.status(500).json({
                error: 'Falha ao processar o upload do arquivo.',
                details: error.message
            });
        }
    };

    /**
     * Downloads a file from Google Drive given its File ID or Shareable Link
     */
    public uploadGDrive = async (req: Request, res: Response): Promise<void> => {
        try {
            const { driveLinkOrId, fileName } = req.body;

            if (!driveLinkOrId) {
                res.status(400).json({ error: 'driveLinkOrId é obrigatório.' });
                return;
            }

            // Extract file ID from link if necessary
            let fileId = driveLinkOrId;
            const match = driveLinkOrId.match(/(?:d\/|id=)([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
                fileId = match[1];
            }

            // Setup Google Drive API
            const drive = google.drive({
                version: 'v3',
                auth: process.env.GOOGLE_API_KEY // Use an API key with Drive read access
            });

            // Need to get file metadata first to know the mimeType and original name if not provided
            const metadataResponse = await drive.files.get({
                fileId: fileId,
                fields: 'name, mimeType'
            });

            const originalName = metadataResponse.data.name || 'downloaded_file';
            const finalName = fileName || originalName;
            
            // Ensure temp directory exists
            const tempDir = path.resolve(__dirname, '../../temp_uploads');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const prefixDate = Date.now();
            const destPath = path.join(tempDir, `${prefixDate}-${finalName}`);
            const absolutePath = path.resolve(destPath);
            const destStream = fs.createWriteStream(absolutePath);

            console.log(`📥 Baixando arquivo do Google Drive: ${fileId} -> ${absolutePath}`);

            // Download file
            const response = await drive.files.get(
                { fileId: fileId, alt: 'media' },
                { responseType: 'stream' }
            );

            await new Promise<void>((resolve, reject) => {
                response.data
                    .on('end', () => {
                        console.log('✅ Download concluído.');
                        resolve();
                    })
                    .on('error', (err: any) => {
                        console.error('❌ Erro no download do GDrive:', err);
                        reject(err);
                    })
                    .pipe(destStream);
            });

            res.status(200).json({
                message: 'Arquivo do Google Drive baixado com sucesso.',
                filePath: absolutePath,
                originalName: finalName,
            });

        } catch (error: any) {
            console.error('❌ Erro no download do Google Drive:', error);
            res.status(500).json({
                error: 'Falha ao baixar arquivo do Google Drive. Verifique se o link é público e a API Key tem permissão.',
                details: error.message
            });
        }
    };
}
