import { Router, Request, Response } from "express";

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     description: Returns a message indicating that the API is running.
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API is running
 */
router.get("/", (_req: Request, res: Response) => {
    return res.json({ message: "API is running" });
});

export default router;
