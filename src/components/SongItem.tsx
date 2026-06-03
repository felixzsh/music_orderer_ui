import { Clock, Trash2, GripVertical, Play } from 'lucide-react';
import { Button } from './ui/button';
import { HierarchicalSong } from '../types/api';

interface SongItemProps {
  song: HierarchicalSong;
  onDelete: (songId: string) => void;
  onMove: (songId: string, sourceTag: string, destTag: string, newIndex: number) => void;
  provided?: any; // Para react-beautiful-dnd
}

export function SongItem({ song, onDelete, onMove, provided }: SongItemProps) {
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

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-md group"
    >
      {/* Drag Handle */}
      <div {...provided?.dragHandleProps} className="opacity-100 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
      </div>

      {/* Song Info with Fixed Widths */}
      <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 text-sm">
        {/* Title - 4 columns */}
        <div className="col-span-4 truncate">
          <span className="text-foreground">{song.title}</span>
        </div>
        
        {/* Artist - 3 columns */}
        <div className="col-span-3 truncate text-muted-foreground">
          {song.artist_names?.join(', ') || 'Artista desconocido'}
        </div>
        
        {/* Duration - 2 columns */}
        <div className="col-span-2 flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(song.duration)}</span>
        </div>
        
        {/* Views - 2 columns */}
        <div className="col-span-2 text-muted-foreground">
          {formatViews(song.views)} {song.views ? 'views' : ''}
        </div>
        
        {/* Actions - 1 column */}
        <div className="col-span-1 flex items-center justify-end gap-1 opacity-100 transition-opacity">
          {song.ids?.[0] && (
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