import { Router } from 'express';
import { VideoStoryGeneratorController } from '../controllers/video_story_generator.controller';

const router = Router();
const controller = new VideoStoryGeneratorController();

router.post('/video/story/generate', controller.handleRender);

export default router;