import { useState, useContext, useRef } from 'react';
import { toast } from 'sonner';
import { PendingRequestsContext, SkippedItem } from './PendingRequestsContext';
import { List, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { API_BASE_URL } from '../constants/api';
import { authHeaders } from '../utils/headers';

interface BulkSearchProps {
  onAddSong: (song: any, tagName: string, artistName?: string) => void;
}

interface BatchResult {
  lines: number;
  found: number;
  notFound: number;
  errors: number;
  skipped: SkippedItem[];
}

export function BulkSearch({ onAddSong }: BulkSearchProps) {
  const [text, setText] = useState('');
  const [progress, setProgress] = useState('');
  const activeCount = useRef(0);
  const [hasActive, setHasActive] = useState(false);
  const { increment, decrement, signal, resetSkips, skippedItemsRef } = useContext(PendingRequestsContext);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const handleSubmit = async () => {
    if (!text.trim()) return;

    const lines = text.split('\n').filter(l => l.trim());
    setText('');
    setProgress(`0 / ${lines.length}`);
    activeCount.current++;
    setHasActive(true);
    increment();
    resetSkips();

    let found = 0;
    let notFound = 0;
    let errors = 0;

    for (let i = 0; i < lines.length; i++) {
      if (signal.aborted) break;

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
          { headers: authHeaders(), signal }
        );
        const data = await response.json();

        if (data.search_result === 'NOT_FOUND') {
          onAddSong(
            { title: songTitle, artist_names: [artist], search_result: 'not_found' },
            'No encontradas', artist
          );
          notFound++;
        } else {
          onAddSong(data, 'todas', artist);
          found++;
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') break;
        onAddSong(
          { title: songTitle, artist_names: [artist], search_result: 'not_found' },
          'No encontradas', artist
        );
        errors++;
      }
    }

    decrement();
    activeCount.current--;
    if (activeCount.current === 0) {
      setHasActive(false);
      setProgress('');
    }

    const skipped = [...skippedItemsRef.current];
    if (skipped.length > 0 || notFound > 0 || errors > 0) {
      setBatchResult({ lines: lines.length, found, notFound, errors, skipped });
      setShowSummary(true);
      toast.success(`Bulk completado: ${found} canciones, ${skipped.length} duplicados, ${notFound} no encontradas`, {
        duration: 5000,
      });
    }
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
          disabled={!text.trim()}
          className="w-full flex-shrink-0"
        >
          <Search className="h-4 w-4 mr-2" />
          {hasActive ? 'Buscando...' : 'Buscar y Agregar Todas'}
        </Button>
      </div>

      <AlertDialog open={showSummary} onOpenChange={setShowSummary}>
        <AlertDialogContent className="max-h-[80vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Resumen del Bulk</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm space-y-2">
                <p>
                  {batchResult?.lines} líneas procesadas · {batchResult?.found} encontradas · {batchResult?.notFound} no encontradas · {batchResult?.errors} errores · {batchResult?.skipped.length} duplicados
                </p>
                {batchResult && batchResult.skipped.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-destructive mb-1">Duplicados ({batchResult.skipped.length}):</p>
                    <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-0.5">
                      {batchResult.skipped.map((item, i) => (
                        <p key={i} className="text-xs truncate">
                          <span className="font-medium">{item.title}</span> — {item.artist}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setShowSummary(false)}>Cerrar</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
