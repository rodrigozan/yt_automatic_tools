import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

/**
 * Orchestrator API - Starts the full video generation and upload process
 */
export const generateAndUploadVideo = async (payload: any) => {
    try {
        const response = await api.post('/orchestrator/generate_and_upload', payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Erro ao gerar e fzr upload do vídeo');
    }
};

/**
 * Local File Upload API
 * @param file The file object (from an input type="file")
 * @returns The absolute path of the uploaded file on the server
 */
export const uploadLocalFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await api.post('/uploads/local', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.filePath;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Erro ao fazer upload do arquivo local');
    }
};

/**
 * Google Drive File Download API
 * @param driveLinkOrId The shareable link or file ID
 * @param fileName (Optional) Desired filename
 * @returns The absolute path of the downloaded file on the server
 */
export const downloadGDriveFile = async (driveLinkOrId: string, fileName?: string): Promise<string> => {
    try {
        const response = await api.post('/uploads/gdrive', { driveLinkOrId, fileName });
        return response.data.filePath;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Erro ao baixar arquivo do Google Drive');
    }
};

/**
 * List Authorized Channels for a user
 */
export const listChannels = async (email: string) => {
    try {
        const response = await api.get('/youtube/channels', { params: { email } });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Erro ao listar canais');
    }
};

/**
 * Update Channel details
 */
export const updateChannel = async (channelId: string, payload: any) => {
    try {
        const response = await api.patch(`/youtube/channels/${channelId}`, payload);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Erro ao atualizar canal');
    }
};

/**
 * Refresh YouTube Access Token
 */
export const refreshYoutubeToken = async (channelId: string, email: string) => {
    const response = await api.post('/youtube/refresh-token', { channelId, email });
    return response.data;
};

/**
 * Get YouTube Authorization URL
 */
export const getYouTubeAuthUrl = async (email: string) => {
    try {
        const response = await api.get('/youtube/auth', { params: { email } });
        return response.data?.url || response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Erro ao obter URL de autorização');
    }
};

/**
 * Get published videos history
 */
export const getPublishedVideos = async (email: string, channelId?: string) => {
    try {
        const params: any = { email };
        if (channelId) params.channelId = channelId;
        const response = await api.get('/history/videos', { params });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Erro ao buscar histórico');
    }
};

/**
 * Refresh video stats from YouTube API
 */
export const refreshVideoStats = async (email: string, videoId?: string) => {
    try {
        const response = await api.post('/history/videos/refresh', { email, videoId });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Erro ao atualizar estatísticas');
    }
};

/**
 * Get single video details
 */
export const getVideoDetails = async (videoId: string) => {
    try {
        const response = await api.get(`/history/videos/${videoId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || 'Erro ao buscar vídeo');
    }
};

export default api;
