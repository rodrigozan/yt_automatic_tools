import { SunoService } from './suno.service';
import { ReplicateMusicService } from './replicate_music.service';
import { SunoMusicModel } from '../models/suno_music.model';

export class MusicGeneratorService {
    private sunoService: SunoService;
    private replicateService: ReplicateMusicService;

    constructor() {
        this.sunoService = new SunoService();
        this.replicateService = new ReplicateMusicService();
    }

    /**
     * Generates music using Suno as primary provider.
     * Falls back to Replicate (MusicGen) if Suno is unavailable or fails.
     */
    public async generate(
        prompt: string,
        options: { instrumental?: boolean; durationSeconds?: number } = {}
    ): Promise<{ music: any; provider: string }> {
        const { instrumental = true, durationSeconds = 30 } = options;

        // --- Try Suno first ---
        if (this.sunoService.isConfigured()) {
            try {
                console.log('[MusicGenerator] Trying Suno AI...');
                const music = await this.sunoService.generate(prompt, instrumental);
                return { music, provider: 'suno' };
            } catch (err: any) {
                console.warn(`[MusicGenerator] Suno failed: ${err.message}. Falling back to Replicate...`);
            }
        } else {
            console.warn('[MusicGenerator] Suno not configured. Using Replicate as primary.');
        }

        // --- Fallback: Replicate / MusicGen ---
        if (this.replicateService.isConfigured()) {
            console.log('[MusicGenerator] Using Replicate (MusicGen)...');
            const music = await this.replicateService.generate(prompt, durationSeconds);
            return { music, provider: 'replicate' };
        }

        throw new Error(
            'No music generation provider is configured. Set SUNO_API_KEY or REPLICATE_API_KEY.'
        );
    }

    public async getStatus(id: string): Promise<any> {
        const music = await SunoMusicModel.findOne({ sunoId: id });
        if (!music) return null;
        return music;
    }

    public async list(page: number = 1, limit: number = 20): Promise<any> {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            SunoMusicModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
            SunoMusicModel.countDocuments(),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    public async delete(id: string): Promise<boolean> {
        const result = await SunoMusicModel.findOneAndDelete({ sunoId: id });
        return !!result;
    }

    public getAvailableProviders(): string[] {
        const providers: string[] = [];
        if (this.sunoService.isConfigured()) providers.push('suno');
        if (this.replicateService.isConfigured()) providers.push('replicate');
        return providers;
    }
}
