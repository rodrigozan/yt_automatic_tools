import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { SunoMusicModel } from '../models/suno_music.model';

// Meta's MusicGen hosted on Replicate
// https://replicate.com/meta/musicgen
const MUSICGEN_VERSION = '671ac645ce5e552cc63a54a2bbff63fcf798043371f4cf4fb5d9e0e3eb6a78f1';

export class ReplicateMusicService {
    private apiKey: string;
    private baseUrl = 'https://api.replicate.com/v1';

    constructor() {
        this.apiKey = process.env.REPLICATE_API_KEY || '';
    }

    public isConfigured(): boolean {
        return !!this.apiKey;
    }

    public async generate(prompt: string, durationSeconds: number = 30): Promise<any> {
        const response = await axios.post(
            `${this.baseUrl}/predictions`,
            {
                version: MUSICGEN_VERSION,
                input: {
                    prompt,
                    model_version: 'stereo-large',
                    output_format: 'mp3',
                    normalization_strategy: 'peak',
                    duration: durationSeconds,
                },
            },
            {
                headers: {
                    Authorization: `Token ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const prediction = response.data;
        const predictionId: string = prediction.id;

        if (!predictionId) throw new Error('Replicate: could not extract prediction ID');

        // Use a deterministic local ID to avoid collisions
        const localId = `replicate_${predictionId}`;

        const newMusic = new SunoMusicModel({
            sunoId: localId,
            prompt,
            provider: 'replicate',
            status: 'queued',
            model_name: 'musicgen-stereo-large',
        });

        await newMusic.save();

        // fire-and-forget polling
        this.pollAndDownload(predictionId, localId).catch((err) =>
            console.error('[Replicate] Background poll error:', err.message)
        );

        return newMusic;
    }

    public async pollAndDownload(predictionId: string, localId: string): Promise<void> {
        const maxAttempts = 60;
        const interval = 5000;

        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((r) => setTimeout(r, interval));

            try {
                const response = await axios.get(`${this.baseUrl}/predictions/${predictionId}`, {
                    headers: { Authorization: `Token ${this.apiKey}` },
                });

                const prediction = response.data;
                const status: string = prediction.status;

                if (status === 'succeeded') {
                    const audioUrl: string = Array.isArray(prediction.output)
                        ? prediction.output[0]
                        : prediction.output;

                    await SunoMusicModel.findOneAndUpdate(
                        { sunoId: localId },
                        {
                            status: 'complete',
                            audioUrl,
                            updatedAt: new Date(),
                        }
                    );

                    if (audioUrl) {
                        await this.downloadFile(audioUrl, localId);
                    }
                    return;
                }

                if (status === 'failed' || status === 'canceled') {
                    await SunoMusicModel.findOneAndUpdate(
                        { sunoId: localId },
                        { status: 'error', updatedAt: new Date() }
                    );
                    console.error(`[Replicate] Generation failed for ${predictionId}: ${prediction.error}`);
                    return;
                }

                // Still processing
                await SunoMusicModel.findOneAndUpdate(
                    { sunoId: localId },
                    { status: 'processing', updatedAt: new Date() }
                );

            } catch (err: any) {
                console.error(`[Replicate] Poll error attempt ${i + 1}:`, err.message);
            }
        }

        await SunoMusicModel.findOneAndUpdate(
            { sunoId: localId },
            { status: 'error', updatedAt: new Date() }
        );
        console.error(`[Replicate] Polling timed out for ${predictionId}`);
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
