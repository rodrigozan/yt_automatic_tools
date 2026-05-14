import { useState, useEffect } from 'react';
import { Youtube, Save, Loader2, ExternalLink, Music, History, Mic, Settings2, RefreshCw } from 'lucide-react';
import { listChannels, updateChannel, refreshYoutubeToken, getYouTubeAuthUrl } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Channel {
    channelId: string;
    channelName: string;
    channelNickname?: string;
    channelPath?: string;
    channelGenre?: string;
    channelType?: string;
    spotifyProfile?: string;
    youtubeChannel?: string;
    instagramProfile?: string;
    tiktokProfile?: string;
    refreshToken: string;
}

export function Channels() {
    const { user } = useAuth();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fetchChannels = async () => {
        if (!user?.email) return;
        try {
            setIsLoading(true);
            const data = await listChannels(user.email);
            setChannels(data.channels);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchChannels();
    }, [user?.email]);

    const handleUpdateChannel = async (channelId: string, data: Partial<Channel>) => {
        if (!user?.email) return;
        try {
            setIsSaving(channelId);
            setError(null);
            setSuccessMessage(null);
            await updateChannel(channelId, { ...data, email: user.email });
            setSuccessMessage(`Canal ${data.channelName || ''} atualizado com sucesso!`);
            fetchChannels();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(null);
        }
    };

    const handleInputChange = (channelId: string, field: keyof Channel, value: string) => {
        setChannels(prev => prev.map(c => 
            c.channelId === channelId ? { ...c, [field]: value } : c
        ));
    };

    const handleRefreshToken = async (channelId: string, channelName: string) => {
        if (!user?.email) return;
        try {
            setIsRefreshing(channelId);
            setError(null);
            setSuccessMessage(null);
            await refreshYoutubeToken(channelId, user.email);
            setSuccessMessage(`Token do canal "${channelName}" atualizado com sucesso!`);
            fetchChannels();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || '';
            if (err.response?.data?.needsReconnect || errorMessage.includes('reconecte')) {
                try {
                    const authUrl = await getYouTubeAuthUrl(user.email);
                    if (authUrl) {
                        window.open(authUrl, '_blank', 'width=600,height=700');
                        setSuccessMessage(`Abra a janela de autorização do Google para o canal "${channelName}".`);
                    } else {
                        setError(`Token expirado. Gere um novo link de autorização.`);
                    }
                } catch (authErr: any) {
                    setError(`Token expirado. Tente gerar novo link de autorização.`);
                }
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsRefreshing(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Canais Autorizados</h2>
                <button 
                    onClick={fetchChannels}
                    className="text-sm text-primary hover:underline"
                >
                    Recarregar
                </button>
            </div>

            {error && (
                <div className="p-4 bg-destructive/15 text-destructive rounded-md">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="p-4 bg-green-500/15 text-green-600 rounded-md">
                    {successMessage}
                </div>
            )}

            {channels.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
                    <Youtube className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-muted-foreground">Nenhum canal autorizado encontrado.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {channels.map((channel) => (
                        <div key={channel.channelId} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Youtube className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{channel.channelName}</h3>
                                        <p className="text-xs text-muted-foreground">{channel.channelNickname} • {channel.channelId}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${channel.refreshToken === '✅ Active' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                                        {channel.refreshToken === '✅ Active' ? 'Ativo' : 'Inativo'}
                                    </span>
                                    <button
                                        onClick={() => handleRefreshToken(channel.channelId, channel.channelName)}
                                        disabled={isRefreshing === channel.channelId}
                                        title="Atualizar token do YouTube"
                                        className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary disabled:opacity-50 transition-all"
                                    >
                                        {isRefreshing === channel.channelId ? (
                                            <Loader2 className="animate-spin" size={14} />
                                        ) : (
                                            <RefreshCw size={14} />
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Informações Básicas */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                        <Settings2 size={14} /> Configurações
                                    </h4>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Nome do Canal</label>
                                        <input 
                                            value={channel.channelName || ''} 
                                            onChange={(e) => handleInputChange(channel.channelId, 'channelName', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-transparent" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Username (@)</label>
                                        <input 
                                            value={channel.channelNickname || ''} 
                                            onChange={(e) => handleInputChange(channel.channelId, 'channelNickname', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-transparent" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Gênero</label>
                                        <input 
                                            value={channel.channelGenre || ''} 
                                            onChange={(e) => handleInputChange(channel.channelId, 'channelGenre', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-transparent" 
                                        />
                                    </div>
                                </div>

                                {/* Classificação e Diretório */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                        <History size={14} /> Classificação
                                    </h4>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Tipo do Canal</label>
                                        <select 
                                            value={channel.channelType || 'music'} 
                                            onChange={(e) => handleInputChange(channel.channelId, 'channelType', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-transparent"
                                        >
                                            <option value="music">Música</option>
                                            <option value="story">História</option>
                                            <option value="podcast_clip">Podcast</option>
                                            <option value="default">Padrão</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium">Caminho Local (Raiz)</label>
                                        <input 
                                            value={channel.channelPath || ''} 
                                            onChange={(e) => handleInputChange(channel.channelId, 'channelPath', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-transparent" 
                                        />
                                    </div>
                                </div>

                                {/* Redes Sociais */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                        <ExternalLink size={14} /> Links Sociais
                                    </h4>
                                    <div className="space-y-2 text-muted-foreground">
                                        <label className="text-xs font-medium flex items-center gap-1.5">
                                            <Music size={12} /> Spotify Profile
                                        </label>
                                        <input 
                                            value={channel.spotifyProfile || ''} 
                                            onChange={(e) => handleInputChange(channel.channelId, 'spotifyProfile', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-transparent" 
                                        />
                                    </div>
                                    <div className="space-y-2 text-muted-foreground">
                                        <label className="text-xs font-medium flex items-center gap-1.5">
                                            <Youtube size={12} /> YouTube Link
                                        </label>
                                        <input 
                                            value={channel.youtubeChannel || ''} 
                                            onChange={(e) => handleInputChange(channel.channelId, 'youtubeChannel', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-transparent" 
                                        />
                                    </div>
                                    <div className="space-y-2 text-muted-foreground">
                                        <label className="text-xs font-medium flex items-center gap-1.5">
                                            <ExternalLink size={12} /> Instagram Profile
                                        </label>
                                        <input 
                                            value={channel.instagramProfile || ''} 
                                            onChange={(e) => handleInputChange(channel.channelId, 'instagramProfile', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-transparent" 
                                        />
                                    </div>
                                    <div className="space-y-2 text-muted-foreground">
                                        <label className="text-xs font-medium flex items-center gap-1.5">
                                            <Mic size={12} /> TikTok Profile
                                        </label>
                                        <input 
                                            value={channel.tiktokProfile || ''} 
                                            onChange={(e) => handleInputChange(channel.channelId, 'tiktokProfile', e.target.value)}
                                            className="w-full px-3 py-1.5 text-sm border border-border rounded-md bg-transparent" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 border-t border-border flex justify-end">
                                <button
                                    onClick={() => handleUpdateChannel(channel.channelId, channel)}
                                    disabled={isSaving === channel.channelId}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                                >
                                    {isSaving === channel.channelId ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <Save size={18} />
                                    )}
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
