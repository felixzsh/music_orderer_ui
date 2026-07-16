// export interface Song {
//   title: string;
//   artist_names: string[];
//   yt_ids?: string[];
//   signature?: string;
//   duration?: number;
//   album_name?: string;
//   quality?: string;
//   views?: number;
//   rank?: number;
//   publish_date?: string;
//   search_result: string;
//   download_status: string;
//   id?: string; // Para identificar canciones en replace
// }


export interface Song {
  title: string;
  artist_names: string[];
  ids?: string[];
  album_name?: string;
  duration?: number;
  quality?: string;
  views?: number;
  rank?: number;
  publish_date?: string;
  search_result: string;
  id?: string;
}

export interface SearchedArtist {
  result_name: string;
  browse_id: string;
  thumbnail_url: string;
}

export interface Artist {
  names: string[];
  description: string;
  subscribers: string;
  views: string;
  browse_id: string;
  playlist_id?: string;
  albums_id?: string;
  albums_params?: string;
}

export interface StreamEvent {
  action: 'add' | 'replace';
  song: Song;
  replace_id?: string;
}

export interface HierarchicalSong extends Song {
  tagName: string; // Cambiado de groupName
  artistName: string;
}

// Simplificada - solo 2 niveles: TagName → Canciones
export interface SongGroup {
  name: string;
  type: 'artist' | 'group';
  songs: HierarchicalSong[];
  isExpanded: boolean;
  count: number; // Para mostrar conteo
}

export type SearchType = 'artist' | 'song' | 'url' | 'prompt' | 'bulk';

export interface Client {
  id: number;
  name: string;
  phoneNumber: string;
}