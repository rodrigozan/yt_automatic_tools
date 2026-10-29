import { Request, Response } from 'express';
import { DownloadError, YoutubeDownloadService } from '../services/yt_download.service';

export class YoutubeDownloadController {
    constructor(private service = new YoutubeDownloadService()) {}

    private respondError(res: Response, error: unknown) {
        res.status(error instanceof DownloadError ? error.status : 500).json({
            error: error instanceof DownloadError ? error.message : 'Falha ao processar o download.',
        });
    }

    create = (req: Request, res: Response) => {
        try { res.status(202).json(this.service.create(req.body)); }
        catch (error) { this.respondError(res, error); }
    };

    status = (req: Request, res: Response) => {
        res.setHeader('Cache-Control', 'no-store');
        try { res.json(this.service.get(String(req.params.id))); }
        catch (error) { this.respondError(res, error); }
    };

    file = (req: Request, res: Response) => {
        try {
            const { filePath, filename } = this.service.file(String(req.params.id));
            res.setHeader('Cache-Control', 'private, no-store');
            res.download(filePath, filename, error => {
                if (error && !res.headersSent) this.respondError(res, new DownloadError('Arquivo indisponível. Inicie outro download.', 410));
            });
        } catch (error) { this.respondError(res, error); }
    };
}
