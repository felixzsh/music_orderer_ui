import { Clock, Trash2, GripVertical, Play, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { HierarchicalSong } from '../types/api';

interface SongItemProps {
  song: HierarchicalSong;
  onDelete: (songId: string) => void;
  onMove: (songId: string, sourceTag: string, destTag: string, newIndex: number) => void;
  onReSearch: (songId: string) => void;
  onUpdateSong: (songId: string, updates: { title?: string; artist?: string }) => void;
  provided?: any;
}

const isNotFound = (song: HierarchicalSong) => song.search_result === 'not_found';

export function SongItem({ song, onDelete, onMove, onReSearch, onUpdateSong, provided }: SongItemProps) {
  const formatDuration = (duration?: number) => {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViews = (views?: number) => {
    if (!views) return '';
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const notFound = isNotFound(song);

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-md group"
    >
      <div {...provided?.dragHandleProps} className="opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      </div>

      <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 text-sm">
        <div className="col-span-4 truncate">
          {notFound ? (
            <Input
              className="h-7 px-2 text-sm"
              value={song.title}
              onChange={e => song.id && onUpdateSong(song.id, { title: e.target.value })}
              placeholder="Título"
            />
          ) : (
            <span className="text-foreground">{song.title}</span>
          )}
        </div>

        <div className="col-span-3 truncate text-muted-foreground">
          {notFound ? (
            <Input
              className="h-7 px-2 text-sm"
              value={song.artist_names?.[0] || ''}
              onChange={e => song.id && onUpdateSong(song.id, { artist: e.target.value })}
              placeholder="Artista"
            />
          ) : (
            <span>{song.artist_names?.join(', ') || 'Artista desconocido'}</span>
          )}
        </div>

        <div className="col-span-2 flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(song.duration)}</span>
        </div>

        <div className="col-span-2 text-muted-foreground">
          {formatViews(song.views)} {song.views ? 'views' : ''}
        </div>

        <div className="col-span-1 flex items-center justify-end gap-1 opacity-100 transition-opacity">
          {notFound && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => song.id && onReSearch(song.id)}
              className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600"
              title="Re-buscar canción"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          {!notFound && song.ids?.[0] && (
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="h-6 w-6 p-0 text-primary hover:text-primary"
              title="Abrir en YouTube"
            >
              <a href={`https://www.youtube.com/watch?v=${song.ids[0]}`} target="_blank" rel="noopener noreferrer">
                <Play className="h-3 w-3" />
              </a>
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => song.id && onDelete(song.id)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            title="Eliminar canción"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}