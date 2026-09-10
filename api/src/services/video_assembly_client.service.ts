import axios from 'axios';

export interface IVideoAssemblyParams {
    audioDir: string;
    imageDir?: string;
    videoDir?: string;
    generationType?: 'playlist' | 'files';
    generationSource: 'video' | 'image' | 'auto_image';
    outputName: string;
    theme: string;
    email: string;
    channelId: string;
    channelType: string;
    channelLang?: string;
    platforms?: string[];
}

export class VideoAssemblyClientService {
    private baseUrl: string;

    constructor() {
        const port = process.env.PORT || 4500;
        this.baseUrl = (process.env.API_INTERNAL_BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');
    }

    public async assemble(params: IVideoAssemblyParams): Promise<any> {
        const response = await axios.post(
            `${this.baseUrl}/api/orchestrator/generate_and_upload`,
            {
                ...params,
                generationType: params.generationType ?? 'playlist',
                platforms: params.platforms ?? [],
            },
            { timeout: 20 * 60 * 1000 }
        );

        return response.data;
    }
}
