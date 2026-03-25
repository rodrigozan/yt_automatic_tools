import { Router } from "express";
import { YtUpdateChannelController } from "../controllers/yt_update_channel.controller";

const router = Router();

/**
 * @swagger
 * /youtube/channels/{channelId}:
 *   patch:
 *     summary: Update YouTube Channel details
 *     description: Updates the details of a specific YouTube channel for a user.
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the channel to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               channelName:
 *                 type: string
 *               channelNickname:
 *                 type: string
 *               channelPath:
 *                 type: string
 *               channelGenre:
 *                 type: string
 *               channelType:
 *                 type: string
 *               spotifyProfile:
 *                 type: string
 *               youtubeChannel:
 *                 type: string
 *               instagramProfile:
 *                 type: string
 *               tiktokProfile:
 *                 type: string
 *     responses:
 *       200:
 *         description: Channel updated successfully
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Error updating channel
 */
router.patch("/youtube/channels/:channelId", YtUpdateChannelController.updateChannel);

export default router;
