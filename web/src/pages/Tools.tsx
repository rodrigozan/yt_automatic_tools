import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { createYoutubeDownload, getYoutubeDownload } from '../lib/api';
import type { YoutubeDownload } from '../lib/api';

function errorMessage(error: unknown) {
    return axios.isAxiosError(error) && typeof error.response?.data?.error === 'string'
        ? error.response.data.error : 'Não foi possível conectar ao servidor. Tente novamente.';
}

export function Tools() {
    const [url, setUrl] = useState('');
    const [quality, setQuality] = useState('1080');
    const [format, setFormat] = useState<'video' | 'mp3'>('video');
    const [job, setJob] = useState<YoutubeDownload | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [pollError, setPollError] = useState('');
    const [now, setNow] = useState(Date.now());
    const busy = submitting || job?.status === 'downloading';
    const expired = !!job?.expiresAt && job.expiresAt <= now;

    useEffect(() => {
        if (!job || job.status !== 'downloading') return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        const poll = async () => {
            try {
                const next = await getYoutubeDownload(job.id, controller.signal);
                if (controller.signal.aborted) return;
                setJob(next);
                setPollError('');
                if (next.status !== 'downloading') return;
            } catch (error) {
                if (controller.signal.aborted) return;
                if (axios.isAxiosError(error) && error.response?.status === 404) {
                    setJob({ ...job, status: 'failed', error: 'Download expirado ou servidor reiniciado. Inicie novamente.' });
                    return;
                }
                setPollError('Conexão interrompida. Tentando consultar o download novamente…');
            }
            timer = setTimeout(poll, 2000);
        };
        timer = setTimeout(poll, 1000);
        return () => { controller.abort(); clearTimeout(timer); };
    }, [job]);

    useEffect(() => {
        if (!job?.expiresAt) return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [job?.expiresAt]);

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (busy) return;
        setSubmitting(true);
        setError('');
        setPollError('');
        setJob(null);
        try { setJob(await createYoutubeDownload(url, quality, format)); }
        catch (error) { setError(errorMessage(error)); }
        finally { setSubmitting(false); }
    }

    return (
        <div className="max-w-3xl space-y-8">
            <header className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Ferramentas</h1>
                <p className="text-sm text-muted-foreground">Baixe vídeos do YouTube para o seu computador.</p>
            </header>
            <section aria-labelledby="download-title" className="rounded-xl bg-card p-5 sm:p-6 space-y-6">
                <div className="space-y-2">
                    <h2 id="download-title" className="text-lg font-medium">Download de vídeos e Shorts</h2>
                    <p className="text-sm text-muted-foreground">Cole o link de um vídeo longo ou Short. Baixe o vídeo em MP4 (com áudio) ou apenas o áudio em MP3.</p>
                </div>
                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="youtube-url" className="block text-sm font-medium">Link do YouTube</label>
                        <input id="youtube-url" type="url" required value={url} disabled={busy}
                            onChange={event => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=…"
                            aria-describedby="youtube-url-help"
                            className="w-full min-h-11 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60" />
                        <p id="youtube-url-help" className="text-sm text-muted-foreground">Aceita youtube.com/watch, youtube.com/shorts e youtu.be.</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="youtube-format" className="block text-sm font-medium">Formato</label>
                        <select id="youtube-format" value={format} disabled={busy} onChange={event => setFormat(event.target.value as 'video' | 'mp3')}
                            className="w-full sm:w-56 min-h-11 rounded-lg border border-input bg-background px-3 text-sm">
                            <option value="video">Vídeo — MP4</option>
                            <option value="mp3">Somente áudio — MP3</option>
                        </select>
                    </div>
                    {format === 'video' && <div className="space-y-2">
                        <label htmlFor="youtube-quality" className="block text-sm font-medium">Resolução máxima</label>
                        <select id="youtube-quality" value={quality} disabled={busy} onChange={event => setQuality(event.target.value)}
                            className="w-full sm:w-56 min-h-11 rounded-lg border border-input bg-background px-3 text-sm">
                            <option value="1080">1080p — Full HD</option>
                            <option value="720">720p — HD</option>
                            <option value="360">360p — Arquivo menor</option>
                        </select>
                        <p className="text-sm text-muted-foreground">Usa a melhor qualidade disponível até o limite escolhido, sem alterar a orientação.</p>
                    </div>}
                    <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-foreground text-background px-5 text-sm font-medium disabled:opacity-50">
                        {busy ? 'Preparando download…' : 'Preparar download'}
                    </button>
                </form>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <div role="status" aria-live="polite" className="space-y-3 text-sm">
                    {job?.status === 'downloading' && <p>Baixando e preparando o {job.format === 'mp3' ? 'MP3' : 'MP4'}. Vídeos longos podem levar vários minutos. Mantenha esta página aberta.</p>}
                    {pollError && <p className="text-muted-foreground">{pollError}</p>}
                    {job?.status === 'failed' && <p className="text-destructive">{job.error}</p>}
                    {job?.status === 'ready' && (expired ? <p>O arquivo expirou. Prepare o download novamente.</p> : <>
                        <p>{job.format === 'mp3' ? 'MP3' : 'MP4'} pronto. O arquivo fica disponível por 1 hora.</p>
                        <a href={job.downloadUrl} download className="inline-flex min-h-11 items-center rounded-lg border border-input px-5 font-medium underline underline-offset-4">Salvar {job.format === 'mp3' ? 'MP3' : 'MP4'}</a>
                    </>)}
                </div>
            </section>
        </div>
    );
}
