import { Router } from 'express'
import {
    video,
    ytAuthorize, ytUploadVideo, ytListChannels, ytUpdateChannel,
    suno,
    videoStoryGenerator, videoMetadataGenerator, videoOrchestrator,
    auth, fileUpload,
    videoIndividualGenerator,
    geminiImage
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
router.use(ytUpdateChannel);
router.use('/auth', auth);
router.use(fileUpload);
router.use(videoIndividualGenerator);
router.use(geminiImage);

export default router