import { Router } from 'express';

import { MetadataController } from '../controllers/video_metadata_generator.conroller';

const router = Router();
const controller = new MetadataController();

router.post('/video/metadata', controller.create);

export default router;