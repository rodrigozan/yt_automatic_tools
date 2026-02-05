import { Router } from 'express'
import { video, ytAuthorize, ytUploadVideo, suno, videoStoryGenerator, videoMetadataGenerator, auth } from './routers';

const router = Router()

router.use(video);
router.use(ytAuthorize);
router.use(ytUploadVideo);
router.use(suno);
router.use(videoStoryGenerator);
router.use(videoMetadataGenerator);
router.use('/auth', auth);

export default router