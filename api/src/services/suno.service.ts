import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { SunoMusicModel } from '../models/suno_music.model';

export class SunoService {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.SUNO_API_KEY || '';
        this.baseUrl = (process.env.SUNO_BASE_URL || 'https://api.sunoapi.org/api/v1').replace(/\/$/, '');
    }

    public isConfigured(): boolean {
        return !!this.apiKey;
    }

    public async generate(prompt: string, instrumental: boolean = true): Promise<any> {
        const response = await axios.post(`${this.baseUrl}/generate`, {
            prompt,
            customMode: false,
            instrumental,
            model: 'V4_5',
            wait_audio: false,
        }, {
            headers: {
                Authorization: `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        const data = response.data?.data ?? response.data;
        // sunoapi.org returns { data: { taskId, sunoData: [{id, status}] } }
        // or sometimes { data: [{id, status}] }
        const sunoId: string =
            data?.sunoData?.[0]?.id ??
            (Array.isArray(data) ? data[0]?.id : data?.id);

        if (!sunoId) throw new Error('Suno: could not extract generation ID from response');

        const newMusic = new SunoMusicModel({
            sunoId,
            prompt,
            provider: 'suno',
            status: 'queued',
        });

        await newMusic.save();

        // fire-and-forget polling
        this.pollAndDownload(sunoId).catch((err) =>
            console.error('[Suno] Background poll error:', err.message)
        );

        return newMusic;
    }

    public async pollAndDownload(sunoId: string): Promise<void> {
        const maxAttempts = 60;
        const interval = 5000;

        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((r) => setTimeout(r, interval));

            try {
                const response = await axios.get(`${this.baseUrl}/feed/${sunoId}`, {
                    headers: { Authorization: `Bearer ${this.apiKey}` },
                });

                const raw = response.data?.data ?? response.data;
                const task = Array.isArray(raw) ? raw[0] : raw;

                if (!task) continue;

                const status: string = task.status ?? '';

                if (status === 'complete' || status === 'succeeded') {
                    await SunoMusicModel.findOneAndUpdate(
                        { sunoId },
                        {
                            status: 'complete',
                            audioUrl: task.audio_url,
                            videoUrl: task.video_url,
                            imageUrl: task.image_url,
                            title: task.title,
                            duration: task.duration,
                            model_name: task.model_name,
                            updatedAt: new Date(),
                        }
                    );

                    if (task.audio_url) {
                        await this.downloadFile(task.audio_url, sunoId);
                    }
                    return;
                }

                if (status === 'error' || status === 'failed') {
                    await SunoMusicModel.findOneAndUpdate(
                        { sunoId },
                        { status: 'error', updatedAt: new Date() }
                    );
                    console.error(`[Suno] Generation failed for ${sunoId}`);
                    return;
                }

                // Still processing — update status in DB
                await SunoMusicModel.findOneAndUpdate({ sunoId }, { status, updatedAt: new Date() });

            } catch (err: any) {
                console.error(`[Suno] Poll error attempt ${i + 1}:`, err.message);
            }
        }

        // Timed out
        await SunoMusicModel.findOneAndUpdate(
            { sunoId },
            { status: 'error', updatedAt: new Date() }
        );
        console.error(`[Suno] Polling timed out for ${sunoId}`);
    }

    private async downloadFile(url: string, filename: string): Promise<string> {
        const assetsDir = path.join(process.cwd(), 'assets', 'musics');
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        const filePath = path.join(assetsDir, `${filename}.mp3`);
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', async () => {
                await SunoMusicModel.findOneAndUpdate(
                    { sunoId: filename },
                    { localPath: filePath, updatedAt: new Date() }
                );
                resolve(filePath);
            });
            writer.on('error', reject);
        });
    }
}
