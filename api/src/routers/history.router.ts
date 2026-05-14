import { Router } from "express";
import { HistoryController } from "../controllers/history.controller";

const router = Router();

router.get("/history/videos", HistoryController.getVideos);

router.get("/history/videos/:videoId", HistoryController.getVideo);

router.post("/history/videos/refresh", HistoryController.refreshStats);

export default router;