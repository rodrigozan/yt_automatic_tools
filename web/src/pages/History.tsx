import { useState, useEffect } from 'react';
import { History as HistoryIcon, LayoutGrid, List, Loader2, ExternalLink, Eye, ThumbsUp, MessageSquare, RefreshCw } from 'lucide-react';
import { getPublishedVideos, refreshVideoStats } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface Video {
  _id?: string;
  youtubeVideoId: string;
  channelId: string;
  channelName?: string;
  title?: string;
  description?: string;
  tags?: string[];
  thumbnailUrl?: string;
  youtubeUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  publishedAt?: string;
}

type ViewMode = 'list' | 'cards';

export function History() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [filterChannel, setFilterChannel] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchVideos = async () => {
    if (!user?.email) return;
    try {
      setIsLoading(true);
      const data = await getPublishedVideos(user.email, filterChannel || undefined);
      setVideos(data.videos || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [user?.email, filterChannel]);

  const handleRefreshStats = async () => {
    if (!user?.email) return;
    try {
      setIsRefreshing(true);
      setError(null);
      const result = await refreshVideoStats(user.email);
      setSuccessMessage(`Estatísticas de ${result.updated}/${result.total} vídeos atualizadas!`);
      fetchVideos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const channels = Array.from(new Set(videos.map(v => v.channelId))).map(id => {
    const v = videos.find(v => v.channelId === id);
    return { channelId: id, channelName: v?.channelName || id };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <HistoryIcon size={28} />
          Histórico de Publicações
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-transparent"
          >
            <option value="">Todos os canais</option>
            {channels.map(c => (
              <option key={c.channelId} value={c.channelId}>{c.channelName}</option>
            ))}
          </select>
          <button
            onClick={fetchVideos}
            className="text-sm text-primary hover:underline"
          >
            Recarregar
          </button>
          <button
            onClick={handleRefreshStats}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isRefreshing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            Atualizar Stats
          </button>
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 ${viewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/15 text-destructive rounded-md">{error}</div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-500/15 text-green-600 rounded-md">{successMessage}</div>
      )}

      {videos.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
          <HistoryIcon className="mx-auto text-muted-foreground mb-4" size={48} />
          <p className="text-muted-foreground">Nenhum vídeo publicado encontrado.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div key={video._id || video.youtubeVideoId} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <a href={video.youtubeUrl || `https://youtube.com/watch?v=${video.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="block">
                <div className="relative aspect-video bg-muted">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <HistoryIcon size={32} />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDate(video.publishedAt)}
                  </div>
                </div>
              </a>
              <div className="p-4 space-y-2">
                <a href={video.youtubeUrl || `https://youtube.com/watch?v=${video.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="block">
                  <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">{video.title || 'Sem título'}</h3>
                </a>
                {video.channelName && (
                  <p className="text-xs text-muted-foreground">{video.channelName}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye size={12} />{formatNumber(video.viewCount)}</span>
                  <span className="flex items-center gap-1"><ThumbsUp size={12} />{formatNumber(video.likeCount)}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={12} />{formatNumber(video.commentCount)}</span>
                </div>
                <a href={video.youtubeUrl || `https://youtube.com/watch?v=${video.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink size={12} /> Ver no YouTube
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div key={video._id || video.youtubeVideoId} className="flex gap-4 bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
              <a href={video.youtubeUrl || `https://youtube.com/watch?v=${video.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <div className="w-40 aspect-video bg-muted rounded-lg overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <HistoryIcon size={24} />
                    </div>
                  )}
                </div>
              </a>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex justify-between gap-4">
                  <a href={video.youtubeUrl || `https://youtube.com/watch?v=${video.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="block">
                    <h3 className="font-semibold hover:text-primary transition-colors line-clamp-1">{video.title || 'Sem título'}</h3>
                  </a>
                  <a href={video.youtubeUrl || `https://youtube.com/watch?v=${video.youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink size={12} />
                  </a>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {video.channelName && <span className="font-medium">{video.channelName}</span>}
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye size={14} />{formatNumber(video.viewCount)} views</span>
                  <span className="flex items-center gap-1"><ThumbsUp size={14} />{formatNumber(video.likeCount)} likes</span>
                  <span className="flex items-center gap-1"><MessageSquare size={14} />{formatNumber(video.commentCount)} comentários</span>
                </div>
                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {video.tags.slice(0, 5).map((tag, i) => (
                      <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}