import { useCallback } from 'react';
import { Song, StreamEvent } from '../types/api';
import { API_BASE_URL } from '../constants/api';
import { authHeaders } from '../utils/headers';

export function useStreamingApi() {
  const streamData = useCallback(async (
    endpoint: string,
    onSong: (song: Song, tagName: string, artistName?: string) => void,
    onStreamEvent?: (event: StreamEvent, tagName: string, artistName?: string) => void,
    tagName: string = '',
    artistName: string = '',
    signal?: AbortSignal,
  ) => {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, { headers: authHeaders(), signal });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

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
              const data = JSON.parse(line);
              
              if (data.action && (data.action === 'add' || data.action === 'replace')) {
                // Es un StreamEvent (hits endpoint)
                if (onStreamEvent) {
                  onStreamEvent(data as StreamEvent, tagName, artistName);
                }
              } else {
                // Es una Song regular
                onSong(data as Song, tagName, artistName);
              }
            } catch (e) {
              console.error('Error parsing JSON:', e, line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }, []);

  return { streamData };
}