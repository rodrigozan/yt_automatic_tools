import { Router } from "express";
import { YtListChannelsController } from "../controllers/yt_list_channels.controller";

const router = Router();

/**
 * @swagger
 * /youtube/channels:
 *   get:
 *     summary: List Authorized YouTube Channels
 *     description: Returns a list of YouTube channels authorized by the user.
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The email of the user whose channels to list.
 *     responses:
 *       200:
 *         description: List of channels retrieved successfully
 *       400:
 *         description: Email parameter is missing
 *       500:
 *         description: Error retrieving channels
 */
router.get("/youtube/channels", YtListChannelsController.listAuthorizedChannels);

export default router;
