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
  // TODO: await readFile(path, "utf8"), then JSON.parse the text and return it
  // TODO: don't catch errors here: a missing file or bad JSON should reject
  throw new Error("not implemented yet");
}

export function buildWrapped(plays: Play[], topCount = 3): Wrapped {
  // TODO: add up msPlayed per artist in a Map
  // TODO: sort by time (highest first); break ties by artist name, A to Z
  // TODO: topArtists = the first topCount, with minutes = Math.round(ms / 60000)
  // TODO: totalMinutes = Math.round(all the ms added together / 60000)
  throw new Error("not implemented yet");
}

export async function createWrapped(inputPath: string, outputPath: string, topCount = 3): Promise<Wrapped> {
  // TODO: load the plays, build the summary, write it to outputPath with JSON.stringify(wrapped, null, 2), return it
  throw new Error("not implemented yet");
}
