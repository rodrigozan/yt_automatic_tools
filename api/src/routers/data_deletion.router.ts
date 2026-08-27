import { Router } from "express";
import { DataDeletionController } from "../controllers/data_deletion.controller";

const router = Router();
const controller = new DataDeletionController();

router.post("/data-deletion/request", (req, res) => controller.requestDeletion(req, res));
router.get("/data-deletion/status/:code", (req, res) => controller.getStatus(req, res));
router.post("/data-deletion/callback", (req, res) => controller.facebookCallback(req, res));
router.get("/data-deletion/callback", (req, res) => controller.facebookCallback(req, res));
router.get("/data-deletion/instructions", (req, res) => controller.instructions(req, res));

export default router;
