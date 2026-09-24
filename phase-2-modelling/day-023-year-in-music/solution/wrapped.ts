import { readFile, writeFile } from "node:fs/promises";

export interface Play {
  track: string;
  artist: string;
  msPlayed: number;
}

export interface ArtistTotal {
  artist: string;
  minutes: number;
}

export interface Wrapped {
  totalMinutes: number;
  topArtists: ArtistTotal[];
}

export async function loadPlays(path: string): Promise<Play[]> {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

export function buildWrapped(plays: Play[], topCount = 3): Wrapped {
  const msByArtist = new Map<string, number>();
  let totalMs = 0;
  for (const play of plays) {
    msByArtist.set(play.artist, (msByArtist.get(play.artist) ?? 0) + play.msPlayed);
    totalMs += play.msPlayed;
  }

  const ranked = [...msByArtist.entries()]
    .map(([artist, ms]) => ({ artist, ms }))
    .sort((a, b) => b.ms - a.ms || a.artist.localeCompare(b.artist));

  return {
    totalMinutes: Math.round(totalMs / 60000),
    topArtists: ranked.slice(0, topCount).map(({ artist, ms }) => ({ artist, minutes: Math.round(ms / 60000) })),
  };
}

export async function createWrapped(inputPath: string, outputPath: string, topCount = 3): Promise<Wrapped> {
  const plays = await loadPlays(inputPath);
  const wrapped = buildWrapped(plays, topCount);
  await writeFile(outputPath, JSON.stringify(wrapped, null, 2));
  return wrapped;
}
