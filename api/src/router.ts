import { Router } from 'express'
import {
    video,
    ytAuthorize, ytUploadVideo, ytListChannels,
    suno,
    videoStoryGenerator, videoMetadataGenerator, videoOrchestrator,
    auth, fileUpload
} from './routers';

const router = Router()

router.use(video);
router.use(ytAuthorize);
router.use(ytUploadVideo);
router.use(suno);
router.use(videoStoryGenerator);
router.use(videoMetadataGenerator);
router.use(videoOrchestrator);
router.use(ytListChannels);
router.use('/auth', auth);
router.use(fileUpload);



export default router