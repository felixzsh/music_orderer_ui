import { useState, useRef, useContext } from 'react';
import { PendingRequestsContext } from './PendingRequestsContext';
import { MessageSquare, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { TagNameInput } from './TagNameInput';
import { useStreamingApi } from '../hooks/useStreamingApi';

interface PromptSearchProps {
  onAddSong: (song: any, tagName: string, artistName?: string) => void;
  existingTags: string[];
}

export function PromptSearch({ onAddSong, existingTags }: PromptSearchProps) {
  const [tagName, setTagName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { streamData } = useStreamingApi();
  const { increment, decrement } = useContext(PendingRequestsContext);

  const searchByPrompt = async () => {
    if (!tagName.trim() || !prompt.trim()) return;
    // Limpiar campos y focus inmediatamente
    setPrompt('');
    setTimeout(() => promptInputRef.current?.focus(), 0);
    increment();
    try {
      await streamData(
        `/metube/search/prompt?prompt=${encodeURIComponent(prompt)}`,
        onAddSong,
        undefined,
        tagName,
        tagName
      );
    } catch (error) {
      console.error('Error searching by prompt:', error);
    } finally {
      decrement();
    }
  };

  const handleTagNameEnter = () => {
    promptInputRef.current?.focus();
  };


  const handlePromptEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      buttonRef.current?.focus();
      searchByPrompt();
    }
  };

  const handleButtonEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchByPrompt();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3>Búsqueda por Prompt</h3>
      </div>

      <div className="space-y-3">
        <TagNameInput
          value={tagName}
          onChange={setTagName}
          existingTags={existingTags}
          placeholder="ej: Música relajante"
          onEnterPress={handleTagNameEnter}
        />

        <div>
          <Label htmlFor="prompt">Descripción</Label>
          <Textarea
            ref={promptInputRef}
            id="prompt"
            placeholder="ej: Canciones de rock clásico de los 70s y 80s"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handlePromptEnter}
            rows={3}
          />
        </div>

        <Button
          ref={buttonRef}
          onClick={searchByPrompt}
          onKeyDown={handleButtonEnter}
          disabled={!tagName.trim() || !prompt.trim()}
          className="w-full"
        >
          <Search className="h-4 w-4 mr-2" />
          Buscar por Descripción
        </Button>
      </div>
    </div>
  );
}
