// An embedder turns text into a vector: a list of numbers where texts that mean similar things get
// similar numbers. Questions and documents are embedded a little differently by good models, so the
// caller says which one it's asking for.
export interface Embedder {
  readonly name: string;
  embed(texts: string[], kind: "query" | "document"): Promise<number[][]>;
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

// --- Voyage AI: a real embedding model (Anthropic recommends it; Claude itself doesn't make embeddings) ---

export const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const BATCH = 128; // texts per request

interface VoyageResponse {
  data: { embedding: number[]; index: number }[];
  usage: { total_tokens: number };
}

// TODO: a Voyage embedder. For each batch of up to BATCH texts, POST to VOYAGE_URL with
// headers Authorization: `Bearer ${apiKey}` and Content-Type: application/json, and the body
// { input: batch, model, input_type: kind }. The model defaults to "voyage-4".
// Not ok: throw `Voyage answered ${status}: ${the body text}`.
// The answer's data can come in any order: sort by each item's index before using the embeddings.
// Its name is the model's name.
export function voyageEmbedder(options: { apiKey: string; model?: string; fetch?: Fetcher }): Embedder {
  void [options, BATCH];
  return { name: "TODO", embed: async () => [] };
}

// --- An embedder with no model at all: for tests, and for trying things offline ---
// Every word (and pair of words) is hashed into one of `dimensions` slots. Texts that share words land
// in the same slots, so their vectors point the same way. It only knows words, not meanings: "refund"
// and "money back" look unrelated to it. That's exactly what a real model adds.

const STOP_WORDS = new Set(
  "a an and are as at be but by can do for from has have i if in is it my of on or so that the this to was we what when where who will with you your na ya wa kwa ni la za cha".split(" "),
);

// Already written: a very rough stemmer: "refunds", "refunded" and "refunding" all become "refund", so they count as
// the same word. Real stemmers are cleverer; this catches the common endings.
export function stem(word: string): string {
  for (const ending of ["ing", "ed", "es", "s"]) {
    if (word.length > ending.length + 3 && word.endsWith(ending)) return word.slice(0, -ending.length);
  }
  return word;
}

// Already written: the words of a text, the way a search reads them.
export function words(text: string): string[] {
  const plain = text.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, ""); // "café" -> "cafe"
  return (plain.match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP_WORDS.has(w)).map(stem);
}

// Already written: FNV-1a, a small, fast, well-spread hash of a string to a 32-bit number.
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// TODO: the hashing embedder, `dimensions` numbers long (all 0 to start).
// The features of a text are its words(), plus every pair of neighbouring words ("m pesa", "pesa prompt").
// For each feature: hash = fnv1a(feature); the slot is hash % dimensions; add 1 to it, or subtract 1
// if the hash's top bit is set (hash & 0x80000000): signs make collisions cancel out instead of piling up.
// Its name is `hashing-${dimensions}`.
export function hashingEmbedder(dimensions = 1024): Embedder {
  return { name: `hashing-${dimensions}`, embed: async (texts) => texts.map(() => new Array<number>(dimensions).fill(0)) };
}
