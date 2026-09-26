import { transliterate } from "./transliterate.ts";

export interface SlugifyOptions {
  separator?: string;
  lowercase?: boolean;
  maxLength?: number;
}

// Find the words, then join them. The old version turned spaces into separators and then deleted
// everything else, so a symbol between two spaces left two separators behind (#12, #19, #24), and a
// separator that wasn't "-" or "_" got deleted along with the symbols (#26).
export function slugify(text: string, options: SlugifyOptions = {}): string {
  if (typeof text !== "string") {
    throw new TypeError(`slugify expects a string, but got ${text === null ? "null" : typeof text} (#23)`);
  }
  const separator = options.separator ?? "-";
  let words = transliterate(text)
    .replace(/['’]/g, "") // "it's" -> "its"
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  if (options.lowercase !== false) words = words.map((w) => w.toLowerCase());

  const max = options.maxLength;
  if (max === undefined) return words.join(separator);
  // As many whole words as fit. One word longer than the limit is cut: there's no boundary to use.
  let slug = "";
  for (const word of words) {
    const longer = slug ? slug + separator + word : word;
    if (longer.length > max) break;
    slug = longer;
  }
  return slug || (words[0] ?? "").slice(0, max);
}
