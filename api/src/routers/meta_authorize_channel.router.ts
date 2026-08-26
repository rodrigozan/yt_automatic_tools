import { Router } from "express";
import { MetaAuthorizeChannelController } from "../controllers/meta_authorize_channel.controller";

const router = Router();

/**
 * @swagger
 * /meta/auth:
 *   get:
 *     summary: Initiate Facebook/Instagram Authorization
 *     description: Redirects to Meta for Page/Instagram Business authorization, scoped to a given channel.
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: channelId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       302:
 *         description: Redirect to Meta Auth
 */
router.get("/meta/auth", MetaAuthorizeChannelController.auth);

/**
 * @swagger
 * /meta/oauth2callback:
 *   get:
 *     summary: Meta OAuth Callback
 *     description: Handles the callback from Meta Authorization, saving the connected Page (and linked Instagram Business account) onto the channel.
 */
router.get("/meta/oauth2callback", MetaAuthorizeChannelController.callback);

/**
 * @swagger
 * /meta/select-page:
 *   get:
 *     summary: Finalizes Page selection when the Meta account manages more than one Page.
 */
router.get("/meta/select-page", MetaAuthorizeChannelController.selectPage);

export default router;
