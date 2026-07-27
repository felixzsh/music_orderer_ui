import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Music, User, Hash, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './ui/button';
import { SongItem } from './SongItem';
import { SongGroup, HierarchicalSong } from '../types/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

type SortKey = 'title' | 'artist' | 'duration' | 'views';

interface GroupSort {
  key: SortKey;
  asc: boolean;
}

interface HierarchicalSongListProps {
  songGroups: { [key: string]: SongGroup };
  onDeleteSong: (songId: string) => void;
  onMoveSong: (songId: string, sourceTag: string, destTag: string, newIndex: number) => void;
  onDeleteGroup: (groupName: string) => void;
  onReSearch: (songId: string) => void;
  onUpdateSong: (songId: string, updates: { title?: string; artist?: string }) => void;
}

function sortSongs(songs: HierarchicalSong[], sort: GroupSort): HierarchicalSong[] {
  return [...songs].sort((a, b) => {
    let cmp = 0;
    switch (sort.key) {
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'artist':
        cmp = (a.artist_names?.[0] || '').localeCompare(b.artist_names?.[0] || '');
        break;
      case 'duration':
        cmp = (a.duration ?? 0) - (b.duration ?? 0);
        break;
      case 'views':
        cmp = (a.views ?? 0) - (b.views ?? 0);
        break;
    }
    return sort.asc ? cmp : -cmp;
  });
}

export function HierarchicalSongList({ songGroups, onDeleteSong, onMoveSong, onDeleteGroup, onReSearch, onUpdateSong }: HierarchicalSongListProps) {
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [sortConfig, setSortConfig] = useState<{ [key: string]: GroupSort }>({});

  const toggleSort = useCallback((groupName: string, key: SortKey) => {
    setSortConfig(prev => {
      const current = prev[groupName];
      if (current?.key === key) {
        return { ...prev, [groupName]: { key, asc: !current.asc } };
      }
      return { ...prev, [groupName]: { key, asc: true } };
    });
  }, []);

  // Sincroniza el estado de expansión con los grupos recibidos
  useEffect(() => {
    setExpandedGroups(prev => {
      const newState = { ...prev };
      let changed = false;
      Object.keys(songGroups).forEach(groupName => {
        if (!(groupName in newState)) {
          newState[groupName] = true; // Por defecto expandidos
          changed = true;
        }
      });
      // Elimina grupos que ya no existen
      Object.keys(newState).forEach(groupName => {
        if (!(groupName in songGroups)) {
          delete newState[groupName];
          changed = true;
        }
      });
      return changed ? newState : prev;
    });
  }, [songGroups]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const getGroupIcon = (type: 'artist' | 'group') => {
    return type === 'artist' ? <User className="h-4 w-4" /> : <Hash className="h-4 w-4" />;
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { draggableId, source, destination } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    onMoveSong(draggableId, source.droppableId, destination.droppableId, destination.index);
  };

  if (Object.keys(songGroups).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Music className="h-12 w-12 mb-4" />
        <p>No hay canciones agregadas</p>
        <p className="text-sm">Usa el Request Builder para agregar canciones</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-1">
        {Object.entries(songGroups).reverse().map(([groupName, group]) => {
          const isGroupExpanded = expandedGroups[groupName] ?? true;

          return (
            <div key={groupName} className="border rounded-md">
              {/* Group Header */}
              <div className="flex items-center justify-between w-full p-3 h-auto hover:bg-accent/50 cursor-pointer">
                <div className="flex items-center gap-2" onClick={() => toggleGroup(groupName)}>
                  {getGroupIcon(group.type)}
                  <span>{groupName}</span>
                  <span className="text-sm text-muted-foreground">
                    ({group.count} cancion{group.count !== 1 ? 'es' : ''})
                  </span>
                  {isGroupExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  title="Eliminar grupo"
                  onClick={() => onDeleteGroup(groupName)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Group Content */}
              {isGroupExpanded && (
                <>
                  {/* Column Headers */}
                  <div className="flex items-center gap-3 px-3 pb-1 text-xs text-muted-foreground font-medium">
                    <div className="w-8 flex-shrink-0" />
                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-2">
                      <button
                        className="col-span-4 flex items-center gap-1 hover:text-foreground text-left"
                        onClick={() => toggleSort(groupName, 'title')}
                      >
                        Título
                        {sortConfig[groupName]?.key === 'title' && (
                          sortConfig[groupName].asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        className="col-span-3 flex items-center gap-1 hover:text-foreground text-left"
                        onClick={() => toggleSort(groupName, 'artist')}
                      >
                        Artista
                        {sortConfig[groupName]?.key === 'artist' && (
                          sortConfig[groupName].asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        className="col-span-2 flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort(groupName, 'duration')}
                      >
                        Duración
                        {sortConfig[groupName]?.key === 'duration' && (
                          sortConfig[groupName].asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        className="col-span-2 flex items-center gap-1 hover:text-foreground justify-end"
                        onClick={() => toggleSort(groupName, 'views')}
                      >
                        Vistas
                        {sortConfig[groupName]?.key === 'views' && (
                          sortConfig[groupName].asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        )}
                      </button>
                      <div className="col-span-1" />
                    </div>
                  </div>

                  <Droppable droppableId={groupName}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="px-3 pb-3"
                      >
                        {(() => {
                          const sort = sortConfig[groupName];
                          const sortedSongs = sort ? sortSongs(group.songs, sort) : group.songs;
                          return sortedSongs.map((song, index) => (
                            <Draggable
                              key={song.id || `${groupName}-${index}`}
                              draggableId={song.id || `${groupName}-${index}`}
                              index={index}
                            >
                              {(provided) => (
                                <SongItem
                                  song={song}
                                  onDelete={onDeleteSong}
                                  onMove={onMoveSong}
                                  onReSearch={onReSearch}
                                  onUpdateSong={onUpdateSong}
                                  provided={provided}
                                />
                              )}
                            </Draggable>
                          ));
                        })()}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </>
              )}
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}