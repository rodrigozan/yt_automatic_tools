import { Router } from 'express';
import { YoutubeDownloadController } from '../controllers/yt_download.controller';

const router = Router();
const controller = new YoutubeDownloadController();
router.post('/youtube/downloads', controller.create);
router.get('/youtube/downloads/:id', controller.status);
router.get('/youtube/downloads/:id/file', controller.file);
export default router;
