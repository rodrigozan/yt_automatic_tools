import React, { useState, useEffect } from 'react';
import { Upload as UploadIcon, Link as LinkIcon, Loader2, Youtube, Music, Languages, Hash, Palette, Info } from 'lucide-react';
import { uploadLocalFile, downloadGDriveFile, generateAndUploadVideo, listChannels } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Input, Select } from '../components/Form';
import { cn } from '../lib/utils';

export function Upload() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [channels, setChannels] = useState<any[]>([]);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // Form State
    const [channelId, setChannelId] = useState('');
    const [email, setEmail] = useState('');
    const [generationType, setGenerationType] = useState('playlist');
    const [generationSource, setGenerationSource] = useState('video');
    const [theme, setTheme] = useState('');
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

    useEffect(() => {
        if (user?.email) {
            loadChannels();
        }
    }, [user]);

    const loadChannels = async () => {
        try {
            const data = await listChannels(user!.email);
            setChannels(Array.isArray(data.channels) ? data.channels : []);
        } catch (err) {
            console.error('Failed to load channels', err);
            setChannels([]);
        }
    };

    const handleChannelChange = (selectedId: string) => {
        setChannelId(selectedId);
        if (!Array.isArray(channels)) return;
        const channel = channels.find(c => c.channelId === selectedId);
        if (channel) {
            setEmail(channel.ownerEmail || user?.email || '');
            setChannelType(channel.channelType || 'music');
            setChannelLang(channel.channelLang || 'pt');
            setNiche(channel.channelGenre || '');
            setMusicGenre(channel.channelGenre || '');
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            if (!channelId) throw new Error('Por favor, selecione um canal.');

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
                ...(generationSource === 'video' && { videoDir: serverVideoPath }),
                ...(generationSource === 'image' && { imageDir: serverImagePath }),
                audioDir: serverAudioPath,
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

    const MediaSection = ({
        label,
        inputType,
        setInputType,
        setFile,
        setGDriveLink,
        gdriveLink,
        icon: Icon
    }: any) => (
        <div className="p-6 glass rounded-2xl border border-white/[0.05] space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon size={18} className="text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{label}</h3>
            </div>
            
            <div className="flex p-1 bg-white/[0.04] rounded-xl w-fit">
                <button
                    type="button"
                    onClick={() => setInputType('file')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                        inputType === 'file' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <UploadIcon size={14} /> Arquivo
                </button>
                <button
                    type="button"
                    onClick={() => setInputType('gdrive')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
                        inputType === 'gdrive' ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <LinkIcon size={14} /> Google Drive
                </button>
            </div>

            {inputType === 'file' ? (
                <div className="relative group">
                    <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center group-hover:border-primary/50 transition-colors">
                        <p className="text-sm text-muted-foreground">Clique ou arraste o arquivo aqui</p>
                    </div>
                </div>
            ) : (
                <Input
                    type="url"
                    value={gdriveLink}
                    onChange={(e) => setGDriveLink(e.target.value)}
                    placeholder="Cole o link ou ID do GDrive..."
                />
            )}
        </div>
    );

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
                    Criar Novo Conteúdo
                </h2>
                <p className="text-muted-foreground mt-2 font-medium">Configure seu vídeo e inicie o processo de geração automática.</p>
            </div>

            {message && (
                <div className={cn(
                    "p-4 rounded-2xl flex items-center gap-3 border animate-in zoom-in-95 duration-300",
                    message.type === 'error' ? "bg-destructive/10 border-destructive/20 text-destructive" : "bg-green-500/10 border-green-500/20 text-green-500"
                )}>
                    <Info size={18} />
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-8">
                {/* 1. Seleção do Canal - O PRIMEIRO */}
                <section className="p-8 glass rounded-3xl border border-white/[0.05] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Youtube size={120} />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 rounded-xl bg-primary/20">
                            <Youtube className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Canal de Destino</h3>
                            <p className="text-sm text-muted-foreground">Escolha o canal onde o vídeo será publicado.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select
                            label="Selecione o Canal"
                            value={channelId}
                            onChange={(e) => handleChannelChange(e.target.value)}
                            options={[
                                { value: '', label: 'Selecione um canal...' },
                                ...channels.map(c => ({ value: c.channelId, label: c.channelName }))
                            ]}
                        />
                        <Input
                            label="Email Vinculado"
                            value={email}
                            readOnly
                            disabled
                            placeholder="Email será preenchido automaticamente"
                        />
                    </div>
                </section>

                {/* 2. Configurações de Geração */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <section className="p-6 glass rounded-2xl border border-white/[0.05] space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Palette size={18} className="text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Tema do Vídeo</h3>
                        </div>
                        <Input
                            required
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            placeholder="Ex: Lofi Gospel Music 2024"
                        />
                    </section>

                    <section className="p-6 glass rounded-2xl border border-white/[0.05] space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Hash size={18} className="text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Nicho / Gênero</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                placeholder="Nicho"
                                value={niche}
                                onChange={(e) => setNiche(e.target.value)}
                            />
                            <Input
                                placeholder="Gênero"
                                value={musicGenre}
                                onChange={(e) => setMusicGenre(e.target.value)}
                            />
                        </div>
                    </section>

                    <section className="p-6 glass rounded-2xl border border-white/[0.05] space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                                <Languages size={18} className="text-primary" />
                            </div>
                            <h3 className="font-semibold text-sm">Idioma & Tipo</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Select
                                value={channelLang}
                                onChange={(e) => setChannelLang(e.target.value)}
                                options={[
                                    { value: 'pt', label: '🇧🇷 PT' },
                                    { value: 'en', label: '🇺🇸 EN' }
                                ]}
                            />
                            <Select
                                value={channelType}
                                onChange={(e) => setChannelType(e.target.value)}
                                options={[
                                    { value: 'music', label: '🎵 Music' },
                                    { value: 'story', label: '📜 Story' },
                                    { value: 'podcast_clip', label: '🎙️ Podcast' },
                                    { value: 'default', label: '⚙️ Default' }
                                ]}
                            />
                        </div>
                    </section>
                </div>

                {/* 3. Fonte Visual e Tipo de Geração */}
                <section className="p-8 glass rounded-2xl border border-white/[0.05]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold">Estrutura e Fonte</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label="Tipo de Geração"
                                    value={generationType}
                                    onChange={(e) => setGenerationType(e.target.value)}
                                    options={[
                                        { value: 'playlist', label: 'Playlist' },
                                        { value: 'files', label: 'Arquivos Separados' }
                                    ]}
                                />
                                <Select
                                    label="Fonte Visual"
                                    value={generationSource}
                                    onChange={(e) => setGenerationSource(e.target.value)}
                                    options={[
                                        { value: 'video', label: 'Vídeo Base' },
                                        { value: 'image', label: 'Imagem Estática' },
                                        { value: 'auto_image', label: 'Imagem IA (Gemini)' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-bold">Mídia</h3>
                            <div className="space-y-4">
                                <MediaSection
                                    label="Áudio Principal"
                                    inputType={audioInputType}
                                    setInputType={setAudioInputType}
                                    setFile={setAudioFile}
                                    setGDriveLink={setAudioGDriveLink}
                                    gdriveLink={audioGDriveLink}
                                    icon={Music}
                                />
                                {generationSource === 'video' ? (
                                    <MediaSection
                                        label="Vídeo de Fundo"
                                        inputType={videoInputType}
                                        setInputType={setVideoInputType}
                                        setFile={setVideoFile}
                                        setGDriveLink={setVideoGDriveLink}
                                        gdriveLink={videoGDriveLink}
                                        icon={UploadIcon}
                                    />
                                ) : generationSource === 'image' ? (
                                    <MediaSection
                                        label="Imagem Base"
                                        inputType={imageInputType}
                                        setInputType={setImageInputType}
                                        setFile={setImageFile}
                                        setGDriveLink={setImageGDriveLink}
                                        gdriveLink={imageGDriveLink}
                                        icon={Palette}
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={isLoading || !channelId}
                    className={cn(
                        "w-full px-4 py-4 rounded-2xl shadow-2xl transition-all font-bold flex items-center justify-center gap-3 text-lg",
                        isLoading || !channelId 
                            ? "bg-muted text-muted-foreground cursor-not-allowed" 
                            : "bg-primary text-primary-foreground hover:scale-[1.01] hover:shadow-primary/20 active:scale-[0.99]"
                    )}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            Processando Geração...
                        </>
                    ) : (
                        <>
                            <UploadIcon size={24} />
                            Iniciar Geração e Upload
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

