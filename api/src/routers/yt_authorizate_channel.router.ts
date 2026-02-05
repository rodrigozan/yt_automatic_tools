import { Router } from "express";
import { YtAuthorizeChannelsController } from "../controllers/yt_authorizate_channel.controller";

const router = Router();

/**
 * @swagger
 * /youtube/auth:
 *   get:
 *     summary: Initiate YouTube Authorization
 *     description: Redirects to Google for YouTube authorization.
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The email of the user to authorize.
 *     responses:
 *       302:
 *         description: Redirect to Google Auth
 */
router.get("/youtube/auth", YtAuthorizeChannelsController.auth);
/**
 * @swagger
 * /youtube/oauth2callback:
 *   get:
 *     summary: YouTube OAuth Callback
 *     description: Handles the callback from Google Authorization.
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: The authorization code returned by Google.
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: true
 *         description: The state parameter, which contains the encoded email.
 *     responses:
 *       200:
 *         description: Authorization successful
 */
router.get("/youtube/oauth2callback", YtAuthorizeChannelsController.callback);

export default router;