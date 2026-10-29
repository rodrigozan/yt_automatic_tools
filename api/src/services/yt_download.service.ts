import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

export class DownloadError extends Error {
    constructor(message: string, public status = 400) { super(message); }
}

export function parseDownloadInput(body: unknown) {
    const { url, quality = '1080', format = 'video' } = (body ?? {}) as Record<string, unknown>;
    if (typeof url !== 'string' || url.length > 2048) throw new DownloadError('Informe um link válido do YouTube.');
    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { throw new DownloadError('Informe um link válido do YouTube.'); }
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.port) {
        throw new DownloadError('Informe um link válido do YouTube.');
    }
    const host = parsed.hostname.toLowerCase();
    const youtube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host);
    const id = host === 'youtu.be' ? parsed.pathname.slice(1)
        : youtube && parsed.pathname === '/watch' ? parsed.searchParams.get('v')
        : youtube ? parsed.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})\/?$/)?.[1] : null;
    if (!id || !/^[\w-]{11}$/.test(id)) throw new DownloadError('Use um link de vídeo ou Short do YouTube, não um canal ou playlist.');
    if (typeof quality !== 'string' || !['360', '720', '1080'].includes(quality)) {
        throw new DownloadError('Qualidade inválida. Use 360, 720 ou 1080.');
    }
    if (format !== 'video' && format !== 'mp3') throw new DownloadError('Formato inválido. Use video ou mp3.');
    return { url: `https://www.youtube.com/watch?v=${id}`, quality, videoId: id, format: format as 'video' | 'mp3' };
}

type Job = {
    id: string; status: 'downloading' | 'ready' | 'failed';
    videoId: string; quality: string; format: 'video' | 'mp3'; error?: string; expiresAt?: number;
    directory?: string; filePath?: string;
};

export type DownloadRunner = (args: string[]) => Promise<void>;

export function describeDownloadFailure(error: { code?: string | number | null; killed?: boolean }, stderr: string): DownloadError {
    if (error.code === 'ENOENT') return new DownloadError('yt-dlp não encontrado. Instale-o no servidor ou configure YT_DLP_PATH.', 502);
    if (error.code === 'EACCES') return new DownloadError('Sem permissão para executar o yt-dlp. Verifique YT_DLP_PATH e as permissões do arquivo.', 502);
    if (error.killed) return new DownloadError('O download excedeu o tempo máximo de preparação. Tente novamente mais tarde.', 504);
    // Classify stderr without exposing paths, proxy credentials or raw downloader output to the client.
    if (/failed to resolve|name or service not known|temporary failure in name resolution|getaddrinfo failed/i.test(stderr)) {
        return new DownloadError('O servidor não conseguiu resolver o endereço do YouTube (falha de DNS). Verifique o DNS e o acesso à internet do servidor.', 502);
    }
    if (/ffmpeg.*(?:not found|not installed)|ffprobe.*(?:not found|not installed)/i.test(stderr)) {
        return new DownloadError('FFmpeg não encontrado pelo yt-dlp. Verifique se FFmpeg e ffprobe estão no PATH da API.', 502);
    }
    if (/sign in to confirm|sign in.*(?:bot|age)|login required|cookies.*required/i.test(stderr)) {
        return new DownloadError('O YouTube exigiu autenticação ou verificação para este acesso. O download anônimo não está disponível neste servidor.', 502);
    }
    if (/requested format is not available/i.test(stderr)) {
        return new DownloadError('Não há um formato MP4 disponível na resolução solicitada. Tente outra resolução ou atualize o yt-dlp.', 502);
    }
    if (/private video|video unavailable|video has been removed|not available in your country/i.test(stderr)) {
        return new DownloadError('O vídeo está privado, foi removido ou não está disponível para este servidor.', 502);
    }
    if (/timed out|connection refused|network is unreachable|unable to connect|connection reset|proxyerror/i.test(stderr)) {
        return new DownloadError('O servidor não conseguiu se conectar ao YouTube. Verifique a conexão, o proxy e as regras de rede.', 502);
    }
    if (/http error 403|http error 429/i.test(stderr)) {
        return new DownloadError('O YouTube recusou ou limitou o acesso deste servidor. Tente mais tarde e verifique se o yt-dlp está atualizado.', 502);
    }
    return new DownloadError('Não foi possível baixar o vídeo. Verifique se ele está público e disponível; confira também yt-dlp e FFmpeg no servidor.', 502);
}

export const runYtDlp: DownloadRunner = args => new Promise((resolve, reject) => {
    execFile(process.env.YT_DLP_PATH || 'yt-dlp', args, {
        timeout: 2 * 60 * 60 * 1000, maxBuffer: 1024 * 1024, killSignal: 'SIGKILL',
    }, (error, _stdout, stderr) => {
        if (!error) return resolve();
        const failure = describeDownloadFailure(error, stderr);
        console.error('[youtube-download]', { code: error.code, error: failure.message });
        reject(failure);
    });
});

export class YoutubeDownloadService {
    private jobs = new Map<string, Job>();
    private active = 0;
    constructor(private runner: DownloadRunner = runYtDlp) {}

    create(body: unknown) {
        const input = parseDownloadInput(body);
        if (this.active >= 2 || this.jobs.size >= 20) throw new DownloadError('Limite de downloads atingido. Tente novamente mais tarde.', 429);
        const job: Job = { id: randomUUID(), status: 'downloading', ...input };
        this.jobs.set(job.id, job);
        this.active++;
        void this.process(job, input.url);
        return this.publicJob(job);
    }

    get(id: string) { return this.publicJob(this.find(id)); }

    file(id: string) {
        const job = this.find(id);
        if (job.status !== 'ready' || !job.filePath) throw new DownloadError('O download ainda não está disponível.', 409);
        return { filePath: job.filePath, filename: job.format === 'mp3' ? `${job.videoId}.mp3` : `${job.videoId}-${job.quality}p.mp4` };
    }

    private find(id: string) {
        const job = this.jobs.get(id);
        if (!job || (job.expiresAt && job.expiresAt <= Date.now())) throw new DownloadError('Download não encontrado ou expirado.', 404);
        return job;
    }

    private publicJob(job: Job) {
        return { id: job.id, status: job.status, videoId: job.videoId, quality: job.quality, format: job.format,
            error: job.error, expiresAt: job.expiresAt,
            downloadUrl: job.status === 'ready' ? `/api/youtube/downloads/${job.id}/file` : undefined };
    }

    private async process(job: Job, url: string) {
        try {
            job.directory = await mkdtemp(path.join(tmpdir(), 'yt-download-'));
            job.filePath = path.join(job.directory, job.format === 'mp3' ? 'audio.mp3' : 'video.mp4');
            await this.runner([
                '--ignore-config', '--no-playlist', '--no-progress', '--quiet', '--no-warnings',
                '--js-runtimes', 'node',
                ...(process.env.YT_DLP_COOKIES ? ['--cookies', process.env.YT_DLP_COOKIES] : []),
                '--socket-timeout', '30', '--retries', '3', '--max-filesize', '2G',
                '--match-filter', '!is_live & !is_upcoming',
                ...(job.format === 'mp3'
                    ? ['-f', 'ba/b', '-x', '--audio-format', 'mp3', '--audio-quality', '0']
                    : ['-f', `bv[ext=mp4][height<=${job.quality}]+ba[ext=m4a]/b[ext=mp4][height<=${job.quality}]`,
                        '--merge-output-format', 'mp4']),
                '--no-part', '-o', job.filePath, '--', url,
            ]);
            const info = await stat(job.filePath);
            if (!info.isFile() || !info.size) throw new Error('Arquivo vazio.');
            job.status = 'ready';
        } catch (error) {
            job.status = 'failed';
            job.error = error instanceof DownloadError ? error.message : 'Falha ao preparar o arquivo de vídeo.';
            if (job.directory) await rm(job.directory, { recursive: true, force: true }).catch(() => {});
        } finally {
            this.active--;
            job.expiresAt = Date.now() + 60 * 60 * 1000;
            const timer = setTimeout(() => {
                this.jobs.delete(job.id);
                if (job.directory) void rm(job.directory, { recursive: true, force: true }).catch(() => {});
            }, 60 * 60 * 1000);
            timer.unref();
        }
    }
}
