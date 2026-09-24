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
  // TODO: add up durationSeconds across every song in playlist.songs
  throw new Error("not implemented yet");
}

export function formatDuration(totalSeconds: number): string {
  // TODO: minutes = Math.floor(totalSeconds / 60), seconds = totalSeconds % 60
  // TODO: return them as "m:ss", padding the seconds to two digits with padStart
  throw new Error("not implemented yet");
}

export function addSong(playlist: Playlist, song: Song): Playlist {
  // TODO: return a NEW playlist with the song added at the end; don't change the original
  throw new Error("not implemented yet");
}
