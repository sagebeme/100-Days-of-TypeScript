export interface Entry {
  word: string;
  meaning: string;
  example?: string;
}

export function lookup(entries: Entry[], word: string): Entry | undefined {
  // TODO: find the entry whose word matches, ignoring case and spaces around it
  throw new Error("not implemented yet");
}

export function addEntry(entries: Entry[], entry: Entry): Entry[] {
  // TODO: return a NEW array with the entry added
  // TODO: throw new Error(`"${entry.word}" is already in the dictionary`) if the word exists (ignoring case)
  throw new Error("not implemented yet");
}

export function search(entries: Entry[], query: string): Entry[] {
  // TODO: entries whose word OR meaning contains the query (ignoring case), sorted by word A to Z
  // TODO: an empty or blank query returns []
  throw new Error("not implemented yet");
}

export function wordOfTheDay(entries: Entry[], dayOfYear: number): Entry {
  // TODO: sort a copy of entries by word, then pick the one at dayOfYear % length
  // TODO: throw new Error("Dictionary is empty") when there are no entries
  throw new Error("not implemented yet");
}
