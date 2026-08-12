import { useEffect, useState } from 'react';
import { Youtube, BarChart2, Video, ThumbsUp, Loader2 } from 'lucide-react';
import { listChannels, getPublishedVideos } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface PublishedVideo {
    channelId: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    publishedAt?: string;
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Dashboard() {
    const { user } = useAuth();
    const [channelCount, setChannelCount] = useState(0);
    const [videos, setVideos] = useState<PublishedVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.email) return;
            try {
                setIsLoading(true);
                const [channelsData, videosData] = await Promise.all([
                    listChannels(user.email),
                    getPublishedVideos(user.email),
                ]);
                setChannelCount(channelsData.channels?.length || 0);
                setVideos(videosData.videos || []);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user?.email]);

    const totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
    const totalLikes = videos.reduce((sum, v) => sum + (v.likeCount || 0), 0);
    const totalComments = videos.reduce((sum, v) => sum + (v.commentCount || 0), 0);

    const now = new Date();
    const weeklyCounts = weekDays.map((_, i) => {
        return videos.filter((v) => {
            if (!v.publishedAt) return false;
            const d = new Date(v.publishedAt);
            const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
            return diffDays >= 0 && diffDays < 7 && d.getDay() === i;
        }).length;
    });
    const maxCount = Math.max(1, ...weeklyCounts);

    const stats = [
        { label: 'Canais Ativos', value: String(channelCount), icon: Youtube },
        { label: 'Vídeos Publicados', value: String(videos.length), icon: Video },
        { label: 'Total de Views', value: totalViews.toLocaleString('pt-BR'), icon: BarChart2 },
        { label: 'Total de Likes', value: totalLikes.toLocaleString('pt-BR'), icon: ThumbsUp },
    ];

    const quickMetrics = [
        { label: 'Total de Views', value: totalViews.toLocaleString('pt-BR'), icon: BarChart2 },
        { label: 'Total de Comentários', value: totalComments.toLocaleString('pt-BR'), icon: ThumbsUp },
        { label: 'Vídeos Publicados', value: String(videos.length), icon: Video },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <span className="text-xs text-muted-foreground px-3 py-1.5 glass rounded-full">
                    YT Automatic Tools
                </span>
            </div>

            {channelCount === 0 && (
                <div className="glass rounded-2xl p-5 text-sm text-muted-foreground">
                    Nenhum canal vinculado ainda. Acesse a página de Canais para autorizar um canal do YouTube.
                </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="glass rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                {label}
                            </p>
                            <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                ))}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Activity chart — 2 cols */}
                <div className="lg:col-span-2 glass rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-sm">Atividade de Upload</h2>
                        <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
                    </div>
                    <div className="flex items-end gap-2 h-28">
                        {weeklyCounts.map((count, i) => (
                            <div
                                key={i}
                                className="flex-1 rounded-lg bg-white/[0.05] flex items-end overflow-hidden"
                            >
                                <div
                                    className="w-full rounded-lg bg-primary/50 transition-all duration-500"
                                    style={{ height: `${(count / maxCount) * 100}%` }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between">
                        {weekDays.map((d) => (
                            <span key={d} className="flex-1 text-center text-xs text-muted-foreground">
                                {d}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Quick metrics — 1 col */}
                <div className="flex flex-col gap-3">
                    {quickMetrics.map(({ label, value, icon: Icon }) => (
                        <div key={label} className="glass rounded-2xl p-4 flex items-center gap-4 flex-1">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="text-xl font-bold">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
