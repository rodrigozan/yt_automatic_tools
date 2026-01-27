import { Router } from 'express'
import { video, ytAuthorize, suno, videoStoryGenerator, videoMetadataGenerator } from './routers';

const router = Router()

router.use(video);
router.use(ytAuthorize);
router.use(suno);
router.use(videoStoryGenerator);
router.use(videoMetadataGenerator);

export default router