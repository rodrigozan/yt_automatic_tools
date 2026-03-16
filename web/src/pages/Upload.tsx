import React, { useState } from 'react';
import { Upload as UploadIcon, Link as LinkIcon, Loader2 } from 'lucide-react';
import { uploadLocalFile, downloadGDriveFile, generateAndUploadVideo } from '../lib/api';

export function Upload() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Form State
    const [generationType, setGenerationType] = useState('playlist');
    const [generationSource, setGenerationSource] = useState('video');
    const [theme, setTheme] = useState('');
    const [email, setEmail] = useState('');
    const [channelId, setChannelId] = useState('');
    const [channelType, setChannelType] = useState('music');
    const [channelLang, setChannelLang] = useState('pt');
    const [niche, setNiche] = useState('');
    const [musicGenre, setMusicGenre] = useState('');

    // File Upload State
    const [videoInputType, setVideoInputType] = useState<'file' | 'gdrive'>('file');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoGDriveLink, setVideoGDriveLink] = useState('');

    const [audioInputType, setAudioInputType] = useState<'file' | 'gdrive'>('file');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioGDriveLink, setAudioGDriveLink] = useState('');

    const [imageInputType, setImageInputType] = useState<'file' | 'gdrive'>('file');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageGDriveLink, setImageGDriveLink] = useState('');

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            // 1. Process Video
            let serverVideoPath = '';
            if (generationSource === 'video') {
                if (videoInputType === 'file' && videoFile) {
                    serverVideoPath = await uploadLocalFile(videoFile);
                } else if (videoInputType === 'gdrive' && videoGDriveLink) {
                    serverVideoPath = await downloadGDriveFile(videoGDriveLink, 'video.mp4');
                } else {
                    throw new Error('Por favor, forneça um vídeo (arquivo ou link) válido.');
                }
            }

            // 2. Process Audio
            let serverAudioPath = '';
            if (audioInputType === 'file' && audioFile) {
                serverAudioPath = await uploadLocalFile(audioFile);
            } else if (audioInputType === 'gdrive' && audioGDriveLink) {
                serverAudioPath = await downloadGDriveFile(audioGDriveLink, 'audio.mp3');
            } else {
                throw new Error('Por favor, forneça um áudio (arquivo ou link) válido.');
            }

            // 3. Process Image (if source is image)
            let serverImagePath = '';
            if (generationSource === 'image') {
                if (imageInputType === 'file' && imageFile) {
                    serverImagePath = await uploadLocalFile(imageFile);
                } else if (imageInputType === 'gdrive' && imageGDriveLink) {
                    serverImagePath = await downloadGDriveFile(imageGDriveLink, 'image.jpg');
                } else {
                    throw new Error('Por favor, forneça uma imagem (arquivo ou link) válida.');
                }
            }

            // 4. Send to Orchestrator
            const payload = {
                generationType,
                generationSource,
                videoDir: serverVideoPath,
                audioDir: serverAudioPath,
                ...(generationSource === 'image' && { imageDir: serverImagePath }),
                theme,
                email,
                channelId,
                channelType,
                channelLang,
                niche,
                musicGenre,
            };

            const response = await generateAndUploadVideo(payload);

            setMessage({
                type: 'success',
                text: response.message || 'Geração e upload concluídos!',
            });

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Ocorreu um erro' });
        } finally {
            setIsLoading(false);
        }
    };

    const FileInputSection = ({
        label,
        inputType,
        setInputType,
        setFile,
        setGDriveLink,
        gdriveLink
    }: any) => (
        <div className="space-y-3 p-4 border border-border rounded-lg bg-card">
            <h3 className="font-semibold">{label}</h3>
            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={() => setInputType('file')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${inputType === 'file' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                >
                    <UploadIcon size={16} /> Arquivo Local
                </button>
                <button
                    type="button"
                    onClick={() => setInputType('gdrive')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm ${inputType === 'gdrive' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                >
                    <LinkIcon size={16} /> Link GDrive
                </button>
            </div>

            {inputType === 'file' ? (
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
            ) : (
                <input
                    type="url"
                    value={gdriveLink}
                    onChange={(e) => setGDriveLink(e.target.value)}
                    placeholder="Cole o link ou ID do GDrive..."
                    className="w-full px-3 py-2 border border-border rounded-md bg-transparent"
                />
            )}
        </div>
    );

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Gerar e Fazer Upload de Vídeo</h2>
            </div>

            {message && (
                <div className={`p-4 rounded-md ${message.type === 'error' ? 'bg-destructive/15 text-destructive' : 'bg-green-500/15 text-green-600'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-8">
                {/* Tipos de Geração */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de Geração</label>
                        <select value={generationType} onChange={(e) => setGenerationType(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent">
                            <option value="playlist">Playlist</option>
                            <option value="files">Arquivos Separados</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fonte Visual</label>
                        <select value={generationSource} onChange={(e) => setGenerationSource(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent">
                            <option value="video">Vídeo Base</option>
                            <option value="image">Imagem Estática</option>
                        </select>
                    </div>
                </div>

                {/* Arquivos */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Arquivos de Mídia</h3>
                    <div className="grid grid-cols-1 gap-4">
                        <FileInputSection
                            label="Áudio Principal (Dir)"
                            inputType={audioInputType}
                            setInputType={setAudioInputType}
                            setFile={setAudioFile}
                            setGDriveLink={setAudioGDriveLink}
                            gdriveLink={audioGDriveLink}
                        />

                        {generationSource === 'video' && (
                            <FileInputSection
                                label="Vídeo Base (Background do LoFi/Música)"
                                inputType={videoInputType}
                                setInputType={setVideoInputType}
                                setFile={setVideoFile}
                                setGDriveLink={setVideoGDriveLink}
                                gdriveLink={videoGDriveLink}
                            />
                        )}

                        {generationSource === 'image' && (
                            <FileInputSection
                                label="Imagem Estática Base"
                                inputType={imageInputType}
                                setInputType={setImageInputType}
                                setFile={setImageFile}
                                setGDriveLink={setImageGDriveLink}
                                gdriveLink={imageGDriveLink}
                            />
                        )}
                    </div>
                </div>

                {/* Detalhes do YouTube e Conteúdo */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Detalhes e YouTube</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tema do Vídeo *</label>
                            <input required value={theme} onChange={(e) => setTheme(e.target.value)} type="text" className="w-full px-3 py-2 border border-border rounded-md bg-transparent" placeholder="Ex: Lofi Gospel Music" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nicho</label>
                            <input value={niche} onChange={(e) => setNiche(e.target.value)} type="text" className="w-full px-3 py-2 border border-border rounded-md bg-transparent" placeholder="Ex: Christian Lofi" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Gênero Musical</label>
                            <input value={musicGenre} onChange={(e) => setMusicGenre(e.target.value)} type="text" className="w-full px-3 py-2 border border-border rounded-md bg-transparent" placeholder="Ex: JazzHop" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Idioma do Canal</label>
                            <select value={channelLang} onChange={(e) => setChannelLang(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent">
                                <option value="pt">Português</option>
                                <option value="en">Inglês</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email da Conta YT *</label>
                            <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-3 py-2 border border-border rounded-md bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ID do Canal YT *</label>
                            <input required value={channelId} onChange={(e) => setChannelId(e.target.value)} type="text" className="w-full px-3 py-2 border border-border rounded-md bg-transparent" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo do Canal YT</label>
                            <select value={channelType} onChange={(e) => setChannelType(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-transparent">
                                <option value="music">Música</option>
                                <option value="story">História</option>
                                <option value="podcast_clip">Podcast</option>
                                <option value="default">Padrão</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md shadow hover:bg-primary/90 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Processando...
                        </>
                    ) : (
                        'Iniciar Geração e Upload'
                    )}
                </button>
            </form>
        </div>
    );
}

