import { useState, useCallback, useEffect, useContext } from 'react';
import { Smartphone, Monitor, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from './ui/button';
import { RequestBuilder } from './RequestBuilder';
import { SongPreview } from './SongPreview';
import { PendingRequestsContext } from './PendingRequestsContext';
import { useMobile } from '../hooks/useMobile';
import { SongGroup, HierarchicalSong, Song, StreamEvent, Client } from '../types/api';
import { API_BASE_URL } from '../constants/api';
import { authHeaders } from '../utils/headers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface OrderingViewProps {
  isAdmin: boolean;
  userPhone?: string;
}

/**
 * Vista de orden compartida entre admin y usuario normal.
 * - isAdmin: muestra el dropdown de clientes (a quién corresponde la orden)
 *   y habilita las features de administrador en SongPreview.
 * - userPhone: número del usuario normal (pedido a su nombre).
 */
export function OrderingView({ isAdmin, userPhone }: OrderingViewProps) {
  const [songGroups, setSongGroups] = useState<{ [key: string]: SongGroup }>(() => {
    const saved = localStorage.getItem('musicOrderer_songGroups');
    return saved ? JSON.parse(saved) : {};
  });
  const { addSkip } = useContext(PendingRequestsContext);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(isAdmin);

  useEffect(() => {
    localStorage.setItem('musicOrderer_songGroups', Object.keys(songGroups).length > 0 ? JSON.stringify(songGroups) : '');
  }, [songGroups]);

  const fetchClients = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/clients`, {
        headers: authHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token');
        window.location.href = '/';
        return;
      }

      const result = await response.json();

      if (result.success) {
        setClients(result.data);
      }
    } catch {
      console.error('Error fetching clients');
    } finally {
      setLoadingClients(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchClients();
  }, [isAdmin, fetchClients]);

  const selectedClient = clients.find(c => c.id.toString() === selectedClientId);

  const [currentPanel, setCurrentPanel] = useState<'builder' | 'preview'>('builder');
  const isMobile = useMobile();

  const handleDeleteGroup = useCallback((groupName: string) => {
    setSongGroups(prev => {
      const newGroups = { ...prev };
      delete newGroups[groupName];
      return newGroups;
    });
  }, []);

  const totalSongs = (Object.values(songGroups) as SongGroup[]).reduce((total, group) => total + group.count, 0);

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
      setSongGroups(prev => {
        const newGroups = { ...prev };

        Object.keys(newGroups).forEach(gName => {
          const group = newGroups[gName];
          group.songs = group.songs.filter(song => song.id !== event.replace_id);
          group.count = group.songs.length;
        });

        return newGroups;
      });

      addSongToGroup(event.song, tagName, artistName || tagName);
    }
  }, [addSongToGroup]);

  const moveFoundSong = useCallback((songId: string, replacement: Song) => {
    setSongGroups(prev => {
      const newGroups = { ...prev };
      let oldSong: HierarchicalSong | undefined;
      let oldGroupName = '';

      for (const groupName of Object.keys(newGroups)) {
        const group = newGroups[groupName];
        const idx = group.songs.findIndex(s => s.id === songId);
        if (idx !== -1) {
          oldSong = group.songs[idx];
          group.songs.splice(idx, 1);
          group.count = group.songs.length;
          oldGroupName = groupName;
          break;
        }
      }

      if (!oldSong) return prev;

      const targetGroup = oldSong.intendedTagName || oldGroupName;
      if (newGroups[oldGroupName]?.count === 0) {
        delete newGroups[oldGroupName];
      }

      const updatedSong: HierarchicalSong = {
        ...replacement,
        id: oldSong.id,
        tagName: targetGroup,
        artistName: oldSong.artistName,
        createdAt: oldSong.createdAt,
        intendedTagName: oldSong.intendedTagName,
      };

      if (!newGroups[targetGroup]) {
        newGroups[targetGroup] = {
          name: targetGroup,
          type: 'group',
          songs: [],
          isExpanded: true,
          count: 0,
        };
      }

      newGroups[targetGroup].songs.unshift(updatedSong);
      newGroups[targetGroup].count = newGroups[targetGroup].songs.length;

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
        moveFoundSong(songId, data);
      }
    } catch {
      // Silently fail
    }
  }, [songGroups, moveFoundSong]);

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
    setSongGroups(prev => {
      const newGroups = { ...prev };

      Object.keys(newGroups).forEach(groupName => {
        const group = newGroups[groupName];
        group.songs = group.songs.filter(song => song.id !== songId);
        group.count = group.songs.length;

        if (group.count === 0) {
          delete newGroups[groupName];
        }
      });

      return newGroups;
    });
  }, []);

  const handleMoveSong = useCallback((songId: string, sourceTag: string, destTag: string, newIndex: number) => {
    setSongGroups(prev => {
      const newGroups = { ...prev };
      let movedSong: HierarchicalSong | null = null;

      if (newGroups[sourceTag]) {
        const songIndex = newGroups[sourceTag].songs.findIndex(song => song.id === songId);
        if (songIndex !== -1) {
          movedSong = newGroups[sourceTag].songs.splice(songIndex, 1)[0];
          newGroups[sourceTag].count = newGroups[sourceTag].songs.length;

          if (newGroups[sourceTag].count === 0) {
            delete newGroups[sourceTag];
          }
        }
      }

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

  const handleSendRequest = useCallback(async (deliveryType: 'DIGITAL_LINK' | 'PHYSICAL_USB', usbSource: 'internal' | 'external') => {
    const phone = isAdmin ? selectedClient?.phoneNumber : userPhone;
    if (!phone) return;

    try {
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
          phoneNumber: phone,
          deliveryType: deliveryType,
          usbSource: usbSource,
          songGroups: orderedGroups
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error del servidor');
      }

      if (data.success) {
        localStorage.removeItem('musicOrderer_songGroups');
        setSongGroups({});
        const who = isAdmin && selectedClient ? ` para ${selectedClient.name}` : '';
        alert(`¡Pedido enviado exitosamente${who}!\n\nID: ${data.data.tempId}\nCanciones: ${data.data.totalSongs}\nPrecio: $${(data.data.price / 100).toFixed(2)}`);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error enviando request:', error);
      alert(`Error enviando el pedido: ${error}`);
    }
  }, [songGroups, isAdmin, selectedClient, userPhone]);

  const phoneNumber = isAdmin ? (selectedClient?.phoneNumber || '') : (userPhone || '');

  const clientHeader = isAdmin ? (
    <div className="flex items-center gap-3">
      {loadingClients ? (
        <div className="text-sm text-muted-foreground">Cargando clientes...</div>
      ) : (
        <Select value={selectedClientId} onValueChange={setSelectedClientId} onOpenChange={(open) => { if (open) fetchClients(); }}>
          <SelectTrigger className="w-[320px]">
            <SelectValue placeholder="Seleccionar cliente..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                {client.name} ({client.phoneNumber})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  ) : null;

  if (isMobile) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center justify-between gap-3 border-b bg-background p-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentPanel(currentPanel === 'builder' ? 'preview' : 'builder')}
            className="relative flex items-center gap-3 overflow-hidden px-6"
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
          {clientHeader}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
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
              phoneNumber={phoneNumber}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {isAdmin && (
        <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
          <div className="text-sm font-medium text-muted-foreground">Panel de Administración</div>
          <div className="ml-auto">{clientHeader}</div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="h-full w-1/2 border-r p-4">
          <RequestBuilder
            onAddSong={addSongToGroup}
            onStreamEvent={handleStreamEvent}
            existingTags={existingTags}
          />
        </div>

        <div className="h-full w-1/2 p-4">
          <SongPreview
            songGroups={songGroups}
            totalSongs={totalSongs}
            onDeleteSong={handleDeleteSong}
            onMoveSong={handleMoveSong}
            onSendRequest={handleSendRequest}
            onDeleteGroup={handleDeleteGroup}
            onReSearch={handleReSearch}
            onUpdateSong={handleUpdateSong}
            phoneNumber={phoneNumber}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </div>
  );
}
