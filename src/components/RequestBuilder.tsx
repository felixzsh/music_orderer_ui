import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { ArtistSearch } from './ArtistSearch';
import { SongSearch } from './SongSearch';
import { UrlSearch } from './UrlSearch';
import { PromptSearch } from './PromptSearch';
import { BulkSearch } from './BulkSearch';
import { SearchType } from '../types/api';

interface RequestBuilderProps {
  onAddSong: (song: any, tagName: string, artistName?: string) => void;
  onStreamEvent: (event: any, tagName: string, artistName?: string) => void;
  existingTags: string[];
}

export function RequestBuilder({ onAddSong, onStreamEvent, existingTags }: RequestBuilderProps) {
  const [searchType, setSearchType] = useState<SearchType>('artist');

  const renderSearchComponent = () => {
    switch (searchType) {
      case 'artist':
        return <ArtistSearch onAddSong={onAddSong} onStreamEvent={onStreamEvent} />;
      case 'song':
        return <SongSearch onAddSong={onAddSong} existingTags={existingTags} />;
      case 'url':
        return <UrlSearch onAddSong={onAddSong} existingTags={existingTags} />;
      case 'prompt':
        return <PromptSearch onAddSong={onAddSong} existingTags={existingTags} />;
      case 'bulk':
        return <BulkSearch onAddSong={onAddSong} />;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Request Builder</CardTitle>
        <div className="flex items-center gap-3">
          <Label className="text-sm whitespace-nowrap">Tipo de búsqueda:</Label>
          <Select value={searchType} onValueChange={(value: SearchType) => setSearchType(value)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecciona el tipo de búsqueda" />
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="artist">Búsqueda por Artista</SelectItem>
              <SelectItem value="song">Búsqueda por Canción</SelectItem>
              <SelectItem value="url">Búsqueda por URL</SelectItem>
              <SelectItem value="prompt">Búsqueda por Prompt</SelectItem>
              <SelectItem value="bulk">Carga por Lote</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {renderSearchComponent()}
      </CardContent>
    </Card>
  );
}