import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { describeDownloadFailure, DownloadError, parseDownloadInput, YoutubeDownloadService } from '../src/services/yt_download.service';

const id = 'dQw4w9WgXcQ';

test('identifica a falha de DNS observada no Short sem expor a saída bruta', () => {
    const stderr = "ERROR: [youtube] 03jfPwfE31w: Unable to download API page: HTTPSConnection(host='www.youtube.com', port=443): Failed to resolve 'www.youtube.com' ([Errno -2] Name or service not known)";
    const error = describeDownloadFailure({ code: 1 }, stderr);
    assert.equal(error.status, 502);
    assert.match(error.message, /falha de DNS/);
    assert.doesNotMatch(error.message, /03jfPwfE31w|HTTPSConnection/);
    assert.equal(parseDownloadInput({ url: 'https://youtube.com/shorts/03jfPwfE31w' }).videoId, '03jfPwfE31w');
});

test('distingue dependências, autenticação, formato, rede e timeout', () => {
    for (const [stderr, expected] of [
        ['ERROR: ffmpeg is not installed', /FFmpeg não encontrado/],
        ['ERROR: Sign in to confirm you’re not a bot', /autenticação/],
        ['ERROR: Requested format is not available', /formato MP4/],
        ['ERROR: Private video', /privado/],
        ['ERROR: Connection timed out', /conectar/],
        ['ERROR: HTTP Error 403: Forbidden', /recusou/],
        ['ERROR: HTTP Error 429: Too Many Requests', /limitou/],
    ] as const) assert.match(describeDownloadFailure({ code: 1 }, stderr).message, expected);
    assert.match(describeDownloadFailure({ code: 'ENOENT' }, '').message, /yt-dlp não encontrado/);
    assert.match(describeDownloadFailure({ code: 'EACCES' }, '').message, /permissão/);
    assert.equal(describeDownloadFailure({ killed: true }, '').status, 504);
    assert.doesNotMatch(describeDownloadFailure({ code: 1 }, 'secret-private-error').message, /secret-private-error/);
});

test('normaliza vídeos longos, Shorts e links curtos sem repassar parâmetros externos', () => {
    for (const url of [`https://www.youtube.com/watch?v=${id}&list=abc`, `https://youtube.com/shorts/${id}?si=abc`, `https://youtu.be/${id}?t=2`, `https://m.youtube.com/watch?v=${id}`]) {
        assert.deepEqual(parseDownloadInput({ url }), { url: `https://www.youtube.com/watch?v=${id}`, videoId: id, quality: '1080', format: 'video' });
    }
});

test('aceita format mp3 e recusa formatos desconhecidos', () => {
    assert.equal(parseDownloadInput({ url: `https://youtu.be/${id}`, format: 'mp3' }).format, 'mp3');
    for (const format of ['wav', 'mp3; ls', 3, null]) {
        assert.throws(() => parseDownloadInput({ url: `https://youtu.be/${id}`, format }), DownloadError);
    }
});

test('recusa hosts externos, credenciais, portas, playlists e qualidades arbitrárias', () => {
    for (const url of [null, {}, 'file:///etc/passwd', `https://youtube.com.evil.test/watch?v=${id}`, `https://youtube.com@evil.test/watch?v=${id}`, `https://user@youtube.com/watch?v=${id}`, `https://youtube.com:8080/watch?v=${id}`, 'https://youtube.com/playlist?list=abc', 'https://youtube.com/@channel', `https://youtu.be/${id}/other`, `https://evil.test/shorts/${id}`]) {
        assert.throws(() => parseDownloadInput({ url }), DownloadError);
    }
    for (const quality of ['best', '1080; touch /tmp/test', 720, null]) {
        assert.throws(() => parseDownloadInput({ url: `https://youtu.be/${id}`, quality }), DownloadError);
    }
    assert.throws(() => parseDownloadInput(null), DownloadError);
});

async function finished(service: YoutubeDownloadService, jobId: string) {
    for (let i = 0; i < 100; i++) {
        const job = service.get(jobId);
        if (job.status !== 'downloading') return job;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Download não terminou.');
}

test('prepara arquivo MP4, limita concorrência e não expõe caminhos no status', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const argsList: string[][] = [];
    const service = new YoutubeDownloadService(async args => {
        argsList.push(args);
        await gate;
        await writeFile(args[args.indexOf('-o') + 1], 'fake mp4');
    });
    const first = service.create({ url: `https://youtu.be/${id}`, quality: '720' });
    const second = service.create({ url: `https://youtube.com/shorts/${id}` });
    assert.equal(first.status, 'downloading');
    assert.throws(() => service.file(first.id), (e: unknown) => e instanceof DownloadError && e.status === 409);
    assert.throws(() => service.create({ url: `https://youtu.be/${id}` }), (e: unknown) => e instanceof DownloadError && e.status === 429);
    release();
    try {
        for (const job of [first, second]) {
            const result = await finished(service, job.id);
            assert.equal(result.status, 'ready');
            assert.equal(result.downloadUrl, `/api/youtube/downloads/${job.id}/file`);
            assert.ok(result.expiresAt! > Date.now());
            assert.equal('filePath' in result, false);
        }
        assert.ok(argsList[0].includes('--no-playlist'));
        assert.ok(argsList[0].includes('--ignore-config'));
        assert.match(argsList[0][argsList[0].indexOf('-f') + 1], /height<=720/);
        assert.equal(argsList[0].at(-1), `https://www.youtube.com/watch?v=${id}`);
        assert.equal(service.file(first.id).filename, `${id}-720p.mp4`);
    } finally {
        for (const job of [first, second]) await rm(path.dirname(service.file(job.id).filePath), { recursive: true, force: true });
    }
});

test('falha do downloader e ausência de arquivo viram estado failed', async () => {
    for (const runner of [async () => { throw new DownloadError('yt-dlp não encontrado.', 502); }, async () => {}]) {
        const service = new YoutubeDownloadService(runner);
        const job = service.create({ url: `https://youtu.be/${id}` });
        const result = await finished(service, job.id);
        assert.equal(result.status, 'failed');
        assert.ok(result.error);
        assert.equal(result.downloadUrl, undefined);
        assert.throws(() => service.file(job.id), DownloadError);
    }
    assert.throws(() => new YoutubeDownloadService().get('../etc/passwd'), (e: unknown) => e instanceof DownloadError && e.status === 404);
});
