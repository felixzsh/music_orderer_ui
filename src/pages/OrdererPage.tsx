import { useState, useCallback, useEffect, useContext } from 'react';
import { Smartphone, Monitor, ToggleLeft, ToggleRight, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { RequestBuilder } from '../components/RequestBuilder';
import { SongPreview } from '../components/SongPreview';
import { PendingRequestsContext } from '../components/PendingRequestsContext';
import { useMobile } from '../hooks/useMobile';
import { useDarkMode } from '../hooks/useDarkMode';
import { SongGroup, HierarchicalSong, Song, StreamEvent } from '../types/api';
import { API_BASE_URL } from '../constants/api';
import { authHeaders } from '../utils/headers';

interface UserData {
  phone: string;
  name: string;
  session_id: string;
  expires_at: string;
}

interface OrdererPageProps {
  userData: UserData;
}

export const OrdererPage = ({ userData }: OrdererPageProps) => {
  const [songGroups, setSongGroups] = useState<{ [key: string]: SongGroup }>(() => {
    const saved = localStorage.getItem('musicOrderer_songGroups');
    return saved ? JSON.parse(saved) : {};
  });
  const { addSkip } = useContext(PendingRequestsContext);
  useEffect(() => {
    localStorage.setItem('musicOrderer_songGroups', Object.keys(songGroups).length > 0 ? JSON.stringify(songGroups) : '');
  }, [songGroups]);

  const [currentPanel, setCurrentPanel] = useState<'builder' | 'preview'>('builder');
  const isMobile = useMobile();
  const { isDark, toggleDarkMode } = useDarkMode();

  // Handler para borrar grupo
  const handleDeleteGroup = useCallback((groupName: string) => {
    setSongGroups(prev => {
      const newGroups = { ...prev };
      delete newGroups[groupName];
      return newGroups;
    });
  }, []);

  const totalSongs = (Object.values(songGroups) as SongGroup[]).reduce((total, group) => total + group.count, 0);

  // Advertencia al recargar/cerrar si hay canciones
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (totalSongs > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [totalSongs]);

  const existingTags = Object.keys(songGroups);

  const generateSongId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9);
  }, []);

  const addSongToGroup = useCallback((
    song: Song,
    tagName: string,
    artistName?: string
  ) => {
    const hierarchicalSong: HierarchicalSong = {
      ...song,
      id: song.id || generateSongId(),
      tagName,
      artistName: artistName || tagName,
      createdAt: Date.now(),
    };

    setSongGroups(prev => {
      const newSongIds = song.ids || (song.id ? [song.id] : []);
      if (newSongIds.length > 0) {
        const existingIds = new Set(
          Object.values(prev).flatMap(g => g.songs.flatMap(s => s.ids || []))
        );
        if (newSongIds.some(id => existingIds.has(id))) {
          addSkip({ title: song.title, artist: artistName || tagName });
          return prev;
        }
      }

      const newGroups = { ...prev };
      
      if (!newGroups[tagName]) {
        newGroups[tagName] = {
          name: tagName,
          type: tagName === artistName ? 'artist' : 'group',
          songs: [],
          isExpanded: true,
          count: 0
        };
      }

      newGroups[tagName].songs.unshift(hierarchicalSong);
      newGroups[tagName].count = newGroups[tagName].songs.length;

      return newGroups;
    });
  }, [generateSongId, addSkip]);

  const handleStreamEvent = useCallback((
    event: StreamEvent, 
    tagName: string, 
    artistName?: string
  ) => {
    if (event.action === 'add') {
      addSongToGroup(event.song, tagName, artistName || tagName);
    } else if (event.action === 'replace' && event.replace_id) {
      // First remove the old song
      setSongGroups(prev => {
        const newGroups = { ...prev };
        
        Object.keys(newGroups).forEach(gName => {
          const group = newGroups[gName];
          group.songs = group.songs.filter(song => song.id !== event.replace_id);
          group.count = group.songs.length;
        });

        return newGroups;
      });

      // Then add the new song
      addSongToGroup(event.song, tagName, artistName || tagName);
    }
  }, [addSongToGroup]);

  const replaceSongInPlace = useCallback((songId: string, replacement: Song) => {
    setSongGroups(prev => {
      const newGroups = { ...prev };
      for (const groupName of Object.keys(newGroups)) {
        const group = newGroups[groupName];
        const idx = group.songs.findIndex(s => s.id === songId);
        if (idx !== -1) {
          const old = group.songs[idx];
          group.songs[idx] = {
            ...replacement,
            id: old.id,
            tagName: old.tagName,
            artistName: old.artistName,
            createdAt: old.createdAt,
          };
          break;
        }
      }
      return newGroups;
    });
  }, []);

  const handleReSearch = useCallback(async (songId: string) => {
    const allSongs = Object.values(songGroups).flatMap(g => g.songs);
    const song = allSongs.find(s => s.id === songId);
    if (!song) return;

    const title = song.title;
    const artist = song.artist_names?.[0] || '';
    if (!artist) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/metube/search/song?query=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`,
        { headers: authHeaders() }
      );
      const data = await response.json();
      if (data.search_result !== 'NOT_FOUND') {
        replaceSongInPlace(songId, data);
      }
    } catch {
      // Silently fail
    }
  }, [songGroups, replaceSongInPlace]);

  const handleUpdateSong = useCallback((songId: string, updates: { title?: string; artist?: string }) => {
    setSongGroups(prev => {
      const newGroups = { ...prev };
      for (const groupName of Object.keys(newGroups)) {
        const group = newGroups[groupName];
        const idx = group.songs.findIndex(s => s.id === songId);
        if (idx !== -1) {
          const song = { ...group.songs[idx] };
          if (updates.title !== undefined) song.title = updates.title;
          if (updates.artist !== undefined) song.artist_names = [updates.artist];
          group.songs[idx] = song;
          break;
        }
      }
      return newGroups;
    });
  }, []);

  const handleDeleteSong = useCallback((songId: string) => {
    // TODO: Sincronización con backend
    console.log('TODO: Delete song from backend:', songId);
    
    setSongGroups(prev => {
      const newGroups = { ...prev };
      
      Object.keys(newGroups).forEach(groupName => {
        const group = newGroups[groupName];
        group.songs = group.songs.filter(song => song.id !== songId);
        group.count = group.songs.length;
        
        // Remove empty groups
        if (group.count === 0) {
          delete newGroups[groupName];
        }
      });

      return newGroups;
    });
  }, []);

  const handleMoveSong = useCallback((songId: string, sourceTag: string, destTag: string, newIndex: number) => {
    // TODO: Sincronización con backend
    console.log('TODO: Move song in backend:', { songId, sourceTag, destTag, newIndex });
    
    setSongGroups(prev => {
      const newGroups = { ...prev };
      let movedSong: HierarchicalSong | null = null;
      
      // Remove from source
      if (newGroups[sourceTag]) {
        const songIndex = newGroups[sourceTag].songs.findIndex(song => song.id === songId);
        if (songIndex !== -1) {
          movedSong = newGroups[sourceTag].songs.splice(songIndex, 1)[0];
          newGroups[sourceTag].count = newGroups[sourceTag].songs.length;
          
          // Remove empty source group
          if (newGroups[sourceTag].count === 0) {
            delete newGroups[sourceTag];
          }
        }
      }
      
      // Add to destination
      if (movedSong) {
        if (!newGroups[destTag]) {
          newGroups[destTag] = {
            name: destTag,
            type: 'group',
            songs: [],
            isExpanded: true,
            count: 0
          };
        }
        
        movedSong.tagName = destTag;
        newGroups[destTag].songs.splice(newIndex, 0, movedSong);
        newGroups[destTag].count = newGroups[destTag].songs.length;
      }

      return newGroups;
    });
  }, []);

 

  const handleSendRequest = useCallback(async (deliveryType: 'DIGITAL_LINK' | 'PHYSICAL_USB') => {
    try {
      // Mostrar estado de carga
      console.log('Enviando request...', { phone: userData.phone, songGroups, deliveryType });
      
      const orderedGroups = Object.fromEntries(
        Object.entries(songGroups).map(([key, group]) => [
          key,
          { ...group, songs: [...group.songs].sort((a, b) => a.createdAt - b.createdAt) }
        ])
      );

      const response = await fetch(`${API_BASE_URL}/api/order/create`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          phoneNumber: userData.phone,
          deliveryType: deliveryType,
          songGroups: orderedGroups
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error del servidor');
      }

      if (data.success) {
        // Éxito - limpiar estado
        localStorage.removeItem('musicOrderer_songGroups');
        setSongGroups({});
        
        // Mostrar confirmación (puedes reemplazar alert con un componente mejor)
        alert(`¡Pedido enviado exitosamente!\n\nID: ${data.data.tempId}\nCanciones: ${data.data.totalSongs}\nPrecio: $${(data.data.price / 100).toFixed(2)}`);
        
        console.log('Orden creada:', data.data);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }

    } catch (error) {
      console.error('Error enviando request:', error);
      alert(`Error enviando el pedido: ${error}`);
    }
  }, [songGroups, userData.phone]);;

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header integrado para móvil */}
        <div className="flex items-center justify-center gap-3 p-4 bg-background border-b">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentPanel(currentPanel === 'builder' ? 'preview' : 'builder')}
            className="flex items-center gap-3 px-6 relative overflow-hidden"
          >
            <div className={`flex items-center gap-2 transition-colors ${
              currentPanel === 'builder' ? '' : 'text-muted-foreground'
            }`}>
              <Monitor className="h-4 w-4" />
              <span>Builder</span>
            </div>
            {currentPanel === 'builder' ? <ToggleLeft className="h-6 w-6" /> : <ToggleRight className="h-6 w-6" />}
            <div className={`flex items-center gap-2 transition-colors ${
              currentPanel === 'preview' ? '' : 'text-muted-foreground'
            }`}>
              <Smartphone className="h-4 w-4" />
              <span>Canciones ({totalSongs})</span>
            </div>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={toggleDarkMode}
            className="flex items-center gap-2 px-4"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
          </Button>
        </div>

        <div className="flex-1 p-4">
          {currentPanel === 'builder' ? (
            <RequestBuilder
              onAddSong={addSongToGroup}
              onStreamEvent={handleStreamEvent}
              existingTags={existingTags}
            />
          ) : (
            <SongPreview
              songGroups={songGroups}
              totalSongs={totalSongs}
              onDeleteSong={handleDeleteSong}
              onMoveSong={handleMoveSong}
              onSendRequest={handleSendRequest}
              onDeleteGroup={handleDeleteGroup}
              onReSearch={handleReSearch}
              onUpdateSong={handleUpdateSong}
              phoneNumber={userData.phone}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header integrado para desktop */}
      <div className="flex items-center justify-center gap-3 p-4 bg-background border-b">
        <Button
          variant="outline"
          size="lg"
          onClick={toggleDarkMode}
          className="flex items-center gap-2 px-4"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Request Builder */}
        <div className="w-1/2 p-4 border-r h-full">
          <RequestBuilder
            onAddSong={addSongToGroup}
            onStreamEvent={handleStreamEvent}
            existingTags={existingTags}
          />
        </div>

        {/* Right Panel - Song Preview */}
        <div className="w-1/2 p-4 h-full">
          <SongPreview
            songGroups={songGroups}
            totalSongs={totalSongs}
            onDeleteSong={handleDeleteSong}
            onMoveSong={handleMoveSong}
            onSendRequest={handleSendRequest}
            onDeleteGroup={handleDeleteGroup}
            onReSearch={handleReSearch}
            onUpdateSong={handleUpdateSong}
            phoneNumber={userData.phone}
          />
        </div>
      </div>
    </div>
  );
};