export interface Song {
  title: string;
  artist: string;
  durationSeconds: number;
}

export interface Playlist {
  name: string;
  songs: Song[];
}

export function totalDuration(playlist: Playlist): number {
  let total = 0;
  for (const song of playlist.songs) {
    total += song.durationSeconds;
  }
  return total;
}

export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function addSong(playlist: Playlist, song: Song): Playlist {
  return { ...playlist, songs: [...playlist.songs, song] };
}
