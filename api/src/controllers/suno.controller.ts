import { Request, Response } from 'express';
import { MusicGeneratorService } from '../services/music_generator.service';

export class SunoController {
    private musicService: MusicGeneratorService;

    constructor() {
        this.musicService = new MusicGeneratorService();
    }

    public generate = async (req: Request, res: Response): Promise<void> => {
        const { prompt, instrumental, durationSeconds } = req.body;

        if (!prompt) {
            res.status(400).json({ error: 'prompt is required' });
            return;
        }

        try {
            const { music, provider } = await this.musicService.generate(prompt, {
                instrumental: instrumental !== false,
                durationSeconds: durationSeconds ?? 30,
            });

            res.status(202).json({
                message: 'Music generation started',
                provider,
                data: music,
            });
        } catch (err: any) {
            console.error('[MusicController] generate error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    public getStatus = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            const music = await this.musicService.getStatus(String(id));

            if (!music) {
                res.status(404).json({ error: 'Music not found' });
                return;
            }

            res.status(200).json({ data: music });
        } catch (err: any) {
            console.error('[MusicController] getStatus error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    public list = async (req: Request, res: Response): Promise<void> => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        try {
            const result = await this.musicService.list(page, limit);
            res.status(200).json(result);
        } catch (err: any) {
            console.error('[MusicController] list error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    public deleteMusic = async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;

        try {
            const deleted = await this.musicService.delete(String(id));

            if (!deleted) {
                res.status(404).json({ error: 'Music not found' });
                return;
            }

            res.status(200).json({ message: 'Music deleted' });
        } catch (err: any) {
            console.error('[MusicController] delete error:', err.message);
            res.status(500).json({ error: err.message });
        }
    };

    public providers = (_req: Request, res: Response): void => {
        res.status(200).json({
            available: this.musicService.getAvailableProviders(),
        });
    };
}
