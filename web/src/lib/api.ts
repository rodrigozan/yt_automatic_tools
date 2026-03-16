import axios from 'axios';

// Update line if deployed to a different environment
const API_BASE_URL = 'http://localhost:4500/api';

const api = axios.create({
    baseURL: API_BASE_URL,
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

export default api;
