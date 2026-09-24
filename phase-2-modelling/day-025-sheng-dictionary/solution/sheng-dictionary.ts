export interface Entry {
  word: string;
  meaning: string;
  example?: string;
}

function normalise(text: string): string {
  return text.trim().toLowerCase();
}

export function lookup(entries: Entry[], word: string): Entry | undefined {
  const wanted = normalise(word);
  return entries.find((entry) => normalise(entry.word) === wanted);
}

export function addEntry(entries: Entry[], entry: Entry): Entry[] {
  if (lookup(entries, entry.word) !== undefined) {
    throw new Error(`"${entry.word}" is already in the dictionary`);
  }
  return [...entries, entry];
}

function byWord(a: Entry, b: Entry): number {
  return a.word.localeCompare(b.word);
}

export function search(entries: Entry[], query: string): Entry[] {
  const wanted = normalise(query);
  if (wanted === "") {
    return [];
  }
  return entries
    .filter((entry) => normalise(entry.word).includes(wanted) || normalise(entry.meaning).includes(wanted))
    .sort(byWord);
}

export function wordOfTheDay(entries: Entry[], dayOfYear: number): Entry {
  if (entries.length === 0) {
    throw new Error("Dictionary is empty");
  }
  const sorted = [...entries].sort(byWord);
  return sorted[dayOfYear % sorted.length];
}
