import { useState, useEffect, useRef } from 'react';
import { Search, User, Users, Eye } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { SearchedArtist, Artist } from '../types/api';
import { useStreamingApi } from '../hooks/useStreamingApi';
import { API_BASE_URL } from '../constants/api';

interface ArtistSearchProps {
  onAddSong: (song: any, tagName: string, artistName?: string) => void;
  onStreamEvent: (event: any, tagName: string, artistName?: string) => void;
}

export function ArtistSearch({ onAddSong, onStreamEvent }: ArtistSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedArtist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<SearchedArtist | null>(null);
  const [artistDetails, setArtistDetails] = useState<Artist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { streamData } = useStreamingApi();

  // Manejar clicks fuera del contenedor de búsqueda
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Buscar artistas mientras escribe
  useEffect(() => {
    const searchArtists = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/metube/search/artist?artist_name=${encodeURIComponent(searchQuery)}`);
        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';
        const results: SearchedArtist[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim()) {
              try {
                const artist = JSON.parse(line) as SearchedArtist;
                results.push(artist);
              } catch (e) {
                console.error('Error parsing artist:', e);
              }
            }
          }
        }

        setSearchResults(results);
      } catch (error) {
        console.error('Error searching artists:', error);
      }
    };

    const debounceTimer = setTimeout(searchArtists, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const selectArtist = async (artist: SearchedArtist) => {
    setSelectedArtist(artist);
    setSearchQuery(artist.result_name);
    setShowDropdown(false);
    setIsLoading(true);

    try {
      await streamData(
        `/metube/artist?browse_id=${artist.browse_id}`,
        () => {},
        undefined,
        '',
        ''
      );
      // Simulamos la respuesta del artista (deberías actualizar esto con streaming real)
      const response = await fetch(`${API_BASE_URL}/metube/artist?browse_id=${artist.browse_id}`);
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const details = JSON.parse(line) as Artist;
              setArtistDetails(details);
            } catch (e) {
              console.error('Error parsing artist details:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching artist details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestHits = async () => {
    if (!selectedArtist || !artistDetails?.playlist_id) return;

    // Limpiar tarjeta y buscador inmediatamente y devolver focus al buscador
    setSelectedArtist(null);
    setArtistDetails(null);
    setSearchQuery('');
    setTimeout(() => searchInputRef.current?.focus(), 0);

    try {
      await streamData(
        `/metube/artist/hits?browse_id=${artistDetails.playlist_id}`,
        onAddSong,
        onStreamEvent,
        selectedArtist.result_name,
        selectedArtist.result_name
      );
    } catch (error) {
      console.error('Error fetching hits:', error);
    }
  };

  const requestDiscography = async () => {
    if (!selectedArtist || !artistDetails?.albums_params || !artistDetails.albums_id) return;

    try {
      await streamData(
        `/metube/artist/discography?browse_id=${artistDetails.albums_id}&params=${encodeURIComponent(artistDetails.albums_params)}`,
        onAddSong,
        undefined,
        selectedArtist.result_name,
        selectedArtist.result_name
      );
    } catch (error) {
      console.error('Error fetching discography:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchResults.length > 0 && !selectedArtist) {
      selectArtist(searchResults[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative" ref={searchContainerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar artista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
            onFocus={() => setShowDropdown(true)}
          />
        </div>
        
        {showDropdown && searchResults.length > 0 && searchQuery.trim().length >= 2 && (
          <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((artist, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer"
                onClick={() => selectArtist(artist)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={artist.thumbnail_url} alt={artist.result_name} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span>{artist.result_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Artista Seleccionado</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedArtist ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mb-4" />
              <p>Artista no seleccionado</p>
              <p className="text-sm">Busca y selecciona un artista arriba</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedArtist.thumbnail_url} alt={selectedArtist.result_name} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3>{selectedArtist.result_name}</h3>
                  {artistDetails && (
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{artistDetails.subscribers}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{artistDetails.views}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {artistDetails && (
                <div>
                  <p className="text-sm">{artistDetails.description}</p>
                </div>
              )}

              {selectedArtist && artistDetails && (
                <div className="flex gap-2">
                  <Button
                    onClick={requestHits}
                    disabled={!artistDetails.playlist_id}
                    className="flex-1"
                  >
                    Pedir Hits
                  </Button>
                  {/* NOTE: cuando este bien implementado habilitarlo...
                  <Button 
                    onClick={requestDiscography}
                    disabled={!artistDetails.albums_params}
                    variant="outline"
                    className="flex-1"
                  >
                    Pedir Discografía
                  </Button>
                   {/**/}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}