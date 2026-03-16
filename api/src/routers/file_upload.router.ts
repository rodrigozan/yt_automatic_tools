import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { FileUploadController } from '../controllers/file_upload.controller';

const router = Router();
const controller = new FileUploadController();

// Configure local storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.resolve(__dirname, '../../temp_uploads');
        // Ensure the temp directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniquePrefix + '-' + file.originalname);
    }
});

const upload = multer({ storage });

/**
 * @swagger
 * /uploads/local:
 *   post:
 *     summary: Upload de arquivo local para o servidor
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Arquivo salvo com sucesso
 *       400:
 *         description: Nenhum arquivo enviado
 */
router.post('/uploads/local', upload.single('file'), controller.uploadLocal);

/**
 * @swagger
 * /uploads/gdrive:
 *   post:
 *     summary: Download de arquivo do Google Drive para o servidor local
 *     tags: [Uploads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driveLinkOrId
 *             properties:
 *               driveLinkOrId:
 *                 type: string
 *                 description: ID ou Link compartilhável do arquivo no Google Drive
 *               fileName:
 *                 type: string
 *                 description: Nome opcional para salvar o arquivo (com extensão)
 *     responses:
 *       200:
 *         description: Arquivo baixado com sucesso
 *       400:
 *         description: Parâmetro driveLinkOrId ausente
 */
router.post('/uploads/gdrive', controller.uploadGDrive);

export default router;
