import { Request, Response } from 'express';

import { MetadataService } from '../services/video_metadata_generator.service';

export class MetadataController {
    private metadataService: MetadataService;

    constructor() {
        this.metadataService = new MetadataService();
    }

    public create = async (req: Request, res: Response): Promise<Response> => {
        try {
            const { theme, niche, musicGenre, language, timestampFile } = req.body;

            // Validação básica de entrada
            if (!theme || !niche || !musicGenre || !language) {
                return res.status(400).json({ error: 'Campos obrigatórios: theme, niche, musicGenre, language.' });
            }

            // Chama o Service que agora resolve tudo (IA + Banco)
            const result = await this.metadataService.create({ theme, niche, musicGenre, language, timestampFile });

            return res.status(201).json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno ao processar metadados.' });
        }
    }
}