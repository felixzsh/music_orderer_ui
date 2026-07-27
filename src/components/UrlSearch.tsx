import { useState, useRef, useContext } from 'react';
import { PendingRequestsContext } from './PendingRequestsContext';
import { Link, Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { TagNameInput } from './TagNameInput';
import { useStreamingApi } from '../hooks/useStreamingApi';

interface UrlSearchProps {
  onAddSong: (song: any, tagName: string, artistName?: string) => void;
  existingTags: string[];
}

export function UrlSearch({ onAddSong, existingTags }: UrlSearchProps) {
  const [tagName, setTagName] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { streamData } = useStreamingApi();
  const { increment, decrement, signal } = useContext(PendingRequestsContext);

  const searchByUrl = async () => {
    if (!tagName.trim() || !url.trim()) return;
    // Limpiar campos y focus inmediatamente
    setUrl('');
    setTimeout(() => urlInputRef.current?.focus(), 0);
    increment();
    try {
      await streamData(
        `/api/search/url?url=${encodeURIComponent(url)}`,
        onAddSong,
        undefined,
        tagName,
        tagName,
        signal
      );
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      console.error('Error searching by URL:', error);
    } finally {
      decrement();
    }
  };

  const handleTagNameEnter = () => {
    urlInputRef.current?.focus();
  };


  const handleUrlEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buttonRef.current?.focus();
      searchByUrl();
    }
  };

  const handleButtonEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchByUrl();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Link className="h-5 w-5" />
        <h3>Búsqueda por URL</h3>
      </div>
      
      <div className="space-y-3">
        <TagNameInput
          value={tagName}
          onChange={setTagName}
          existingTags={existingTags}
          placeholder="ej: Playlist favoritas"
          onEnterPress={handleTagNameEnter}
        />
        
        <div>
          <Label htmlFor="url">URL</Label>
          <Input
            ref={urlInputRef}
            id="url"
            placeholder="ej: https://youtube.com/playlist?list=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleUrlEnter}
          />
        </div>
        
        <Button 
          ref={buttonRef}
          onClick={searchByUrl}
          onKeyDown={handleButtonEnter}
          disabled={!tagName.trim() || !url.trim()}
          className="w-full"
        >
          <Search className="h-4 w-4 mr-2" />
          Procesar URL
        </Button>
      </div>
    </div>
  );
}