import { Router } from 'express'
import { video, ytAuthorize, suno } from './routers';

const router = Router()

router.use(video);
router.use(ytAuthorize);
router.use(suno);

export default router