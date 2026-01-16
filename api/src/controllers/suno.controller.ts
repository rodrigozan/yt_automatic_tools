import { Request, Response } from 'express';
import { SunoService } from '../services/suno.service';

export class SunoController {
    private sunoService: SunoService;

    constructor() {
        this.sunoService = new SunoService();
    }

    public generate = async (req: Request, res: Response): Promise<void> => {
        try {
            const { prompt } = req.body;

            if (!prompt) {
                res.status(400).json({ error: 'Prompt is required' });
                return;
            }

            const result = await this.sunoService.generate(prompt);

            res.status(200).json({
                message: 'Music generation started',
                data: result
            });

        } catch (error: any) {
            console.error('Controller Error:', error);
            res.status(500).json({
                error: 'Failed to initiate music generation',
                details: error.message
            });
        }
    }
}
