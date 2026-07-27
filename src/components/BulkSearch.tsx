import { useState, useContext } from 'react';
import { PendingRequestsContext } from './PendingRequestsContext';
import { List, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { API_BASE_URL } from '../constants/api';
import { authHeaders } from '../utils/headers';

interface BulkSearchProps {
  onAddSong: (song: any, tagName: string, artistName?: string) => void;
}

export function BulkSearch({ onAddSong }: BulkSearchProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const { increment, decrement } = useContext(PendingRequestsContext);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    const lines = text.split('\n').filter(l => l.trim());
    setIsLoading(true);
    setProgress(`0 / ${lines.length}`);
    increment();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const separatorIndex = line.lastIndexOf(' - ');

      if (separatorIndex === -1) continue;

      const songTitle = line.substring(0, separatorIndex).trim();
      const artist = line.substring(separatorIndex + 3).trim();

      if (!songTitle || !artist) continue;

      setProgress(`${i + 1} / ${lines.length}: ${songTitle}`);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/metube/search/song?query=${encodeURIComponent(songTitle)}&artist=${encodeURIComponent(artist)}`,
          { headers: authHeaders() }
        );
        const data = await response.json();

        if (data.search_result === 'NOT_FOUND') {
          onAddSong(
            {
              title: songTitle,
              artist_names: [artist],
              search_result: 'not_found',
            },
            'No encontradas',
            artist
          );
        } else {
          onAddSong(data, 'todas', artist);
        }
      } catch {
        onAddSong(
          {
            title: songTitle,
            artist_names: [artist],
            search_result: 'not_found',
          },
          'No encontradas',
          artist
        );
      }
    }

    decrement();
    setIsLoading(false);
    setProgress('');
    setText('');
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <List className="h-5 w-5" />
        <h3>Carga por Lote</h3>
      </div>
      <div className="flex-1 flex flex-col min-h-0 space-y-3">
        <div className="flex-1 flex flex-col min-h-0">
          <Label htmlFor="bulkText" className="flex-shrink-0">
            Lista de canciones (una por línea, formato: <code>canción - artista</code>)
          </Label>
          <Textarea
            id="bulkText"
            placeholder={`ej: Bohemian Rhapsody - Queen\nBillie Jean - Michael Jackson\nImagine - John Lennon`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 min-h-0 mt-2 resize-none"
          />
        </div>

        {progress && (
          <p className="flex-shrink-0 text-sm text-muted-foreground">{progress}</p>
        )}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="w-full flex-shrink-0"
        >
          <Search className="h-4 w-4 mr-2" />
          {isLoading ? 'Buscando...' : 'Buscar y Agregar Todas'}
        </Button>
      </div>
    </div>
  );
}
