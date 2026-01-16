import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { SunoMusicModel } from '../models/suno_music.model';

export class SunoService {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.SUNO_API_KEY || '';
        this.baseUrl = process.env.SUNO_BASE_URL || 'https://api.suno.ai/api/v1'; // Placeholder URL, adjust as needed
    }

    public async generate(prompt: string): Promise<any> {
        try {
            // Placeholder for actual API call
            // Depending on the specific Suno API wrapper or endpoint used
            const response = await axios.post(`${this.baseUrl}/generate`, {
                prompt: prompt,
                customMode: false,
                instrumental: false,
                model: "V4_5ALL",
                wait_audio: false,
                callBackUrl: "http://localhost:4500/suno/callback"
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = response.data; // data usually contains an array of generated items or a job ID

            // Assuming response.data is an array of tasks or a single object with ID
            // Adjust according to actual API response structure
            // Example: { id: "...", status: "..." }

            const sunoId = data.id || data[0]?.id; // Fallback logic

            const newMusic = new SunoMusicModel({
                sunoId: sunoId,
                prompt: prompt,
                status: data.status || 'queued'
            });

            await newMusic.save();

            // Trigger polling in background (fire and forget or manage via queue)
            this.pollAndDownload(sunoId);

            return newMusic;

        } catch (error: any) {
            console.error('Error generating music:', error.response?.data || error.message);
            throw new Error('Failed to generate music');
        }
    }

    public async pollAndDownload(sunoId: string): Promise<void> {
        const maxAttempts = 60;
        const interval = 5000; // 5 seconds

        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await axios.get(`${this.baseUrl}/feed/${sunoId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`
                    }
                });

                const data = response.data;
                // Data might be an array if checking feed, or object if checking specific ID
                const task = Array.isArray(data) ? data[0] : data;

                if (task.status === 'complete' || task.status === 'succeeded') {
                    const musicRecord = await SunoMusicModel.findOne({ sunoId: sunoId });
                    if (musicRecord) {
                        musicRecord.status = 'complete';
                        musicRecord.audioUrl = task.audio_url;
                        musicRecord.videoUrl = task.video_url;
                        musicRecord.imageUrl = task.image_url;
                        musicRecord.title = task.title;
                        musicRecord.duration = task.duration;
                        musicRecord.model_name = task.model_name;

                        await musicRecord.save();

                        if (task.audio_url) {
                            await this.downloadFile(task.audio_url, sunoId);
                        }
                    }
                    break;
                } else if (task.status === 'error') {
                    await SunoMusicModel.findOneAndUpdate({ sunoId }, { status: 'error' });
                    console.error(`Generation failed for ${sunoId}`);
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, interval));

            } catch (error) {
                console.error(`Error polling for ${sunoId}:`, error);
                // Continue polling despite temporary errors?
            }
        }
    }

    private async downloadFile(url: string, filename: string): Promise<string> {
        try {
            const assetsDir = path.join(process.cwd(), 'assets', 'musics');
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
            }

            const filePath = path.join(assetsDir, `${filename}.mp3`);

            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(filePath);

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', async () => {
                    // Update local path in DB
                    await SunoMusicModel.findOneAndUpdate({ sunoId: filename }, { localPath: filePath });
                    resolve(filePath);
                });
                writer.on('error', reject);
            });

        } catch (error) {
            console.error(`Error downloading file from ${url}:`, error);
            throw error;
        }
    }
}
