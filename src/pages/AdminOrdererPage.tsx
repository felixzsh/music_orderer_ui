import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Monitor, ToggleLeft, ToggleRight, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/button';
import { RequestBuilder } from '../components/RequestBuilder';
import { SongPreview } from '../components/SongPreview';
import { useMobile } from '../hooks/useMobile';
import { useDarkMode } from '../hooks/useDarkMode';
import { SongGroup, HierarchicalSong, Song, StreamEvent, Client } from '../types/api';
import { API_BASE_URL } from '../constants/api';
import { authHeaders } from '../utils/headers';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function AdminOrdererPage() {
  const [songGroups, setSongGroups] = useState<{ [key: string]: SongGroup }>(() => {
    const saved = localStorage.getItem('musicOrderer_songGroups');
    return saved ? JSON.parse(saved) : {};
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [loadingClients, setLoadingClients] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('musicOrderer_songGroups', Object.keys(songGroups).length > 0 ? JSON.stringify(songGroups) : '');
  }, [songGroups]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/clients`, {
        headers: authHeaders(),
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token');
        navigate('/', { replace: true });
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
  }, [navigate]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const selectedClient = clients.find(c => c.id.toString() === selectedClientId);

  const [currentPanel, setCurrentPanel] = useState<'builder' | 'preview'>('builder');
  const isMobile = useMobile();
  const { isDark, toggleDarkMode } = useDarkMode();

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
      artistName: artistName || tagName
    };

    setSongGroups(prev => {
      const newSongIds = song.ids || (song.id ? [song.id] : []);
      if (newSongIds.length > 0) {
        const existingIds = new Set(
          Object.values(prev).flatMap(g => g.songs.flatMap(s => s.ids || []))
        );
        if (newSongIds.some(id => existingIds.has(id))) {
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
  }, [generateSongId]);

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

  const handleSendRequest = useCallback(async (deliveryType: 'DIGITAL_LINK' | 'PHYSICAL_USB') => {
    if (!selectedClient) return;

    try {
      const orderedGroups = Object.fromEntries(
        Object.entries(songGroups).map(([key, group]) => [
          key,
          { ...group, songs: [...group.songs].reverse() }
        ])
      );

      const response = await fetch(`${API_BASE_URL}/api/order/create`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          phoneNumber: selectedClient.phoneNumber,
          deliveryType: deliveryType,
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
        alert(`Pedido enviado exitosamente para ${selectedClient.name}\n\nID: ${data.data.tempId}\nCanciones: ${data.data.totalSongs}\nPrecio: $${(data.data.price / 100).toFixed(2)}`);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error enviando request:', error);
      alert(`Error enviando el pedido: ${error}`);
    }
  }, [songGroups, selectedClient]);

  const clientHeader = (
    <div className="flex items-center gap-3">
      {loadingClients ? (
        <div className="text-sm text-muted-foreground">Cargando clientes...</div>
      ) : (
        <Select value={selectedClientId} onValueChange={setSelectedClientId} onOpenChange={(open) => { setDropdownOpen(open); if (open) fetchClients(); }}>
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
  );

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex items-center justify-between gap-3 p-4 bg-background border-b">
          {clientHeader}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentPanel(currentPanel === 'builder' ? 'preview' : 'builder')}
            className="flex items-center gap-3 px-6"
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
              phoneNumber={selectedClient?.phoneNumber || ''}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 py-3 bg-background border-b">
        <div className="text-sm font-medium text-muted-foreground">Panel de Administración</div>
        {clientHeader}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 p-4 border-r h-full">
          <RequestBuilder
            onAddSong={addSongToGroup}
            onStreamEvent={handleStreamEvent}
            existingTags={existingTags}
          />
        </div>

        <div className="w-1/2 p-4 h-full">
          <SongPreview
            songGroups={songGroups}
            totalSongs={totalSongs}
            onDeleteSong={handleDeleteSong}
            onMoveSong={handleMoveSong}
            onSendRequest={handleSendRequest}
            onDeleteGroup={handleDeleteGroup}
            phoneNumber={selectedClient?.phoneNumber || ''}
          />
        </div>
      </div>
    </div>
  );
}
