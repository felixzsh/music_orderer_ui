import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Music, User, Hash, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { SongItem } from './SongItem';
import { SongGroup, HierarchicalSong } from '../types/api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface HierarchicalSongListProps {
  songGroups: { [key: string]: SongGroup };
  onDeleteSong: (songId: string) => void;
  onMoveSong: (songId: string, sourceTag: string, destTag: string, newIndex: number) => void;
  onDeleteGroup: (groupName: string) => void;
}

export function HierarchicalSongList({ songGroups, onDeleteSong, onMoveSong, onDeleteGroup }: HierarchicalSongListProps) {
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});

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
                <Droppable droppableId={groupName}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="px-3 pb-3"
                    >
                      {group.songs.map((song, index) => (
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
                              provided={provided}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}