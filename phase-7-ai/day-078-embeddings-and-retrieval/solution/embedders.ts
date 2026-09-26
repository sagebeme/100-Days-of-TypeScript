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

export function voyageEmbedder(options: { apiKey: string; model?: string; fetch?: Fetcher }): Embedder {
  const model = options.model ?? "voyage-4";
  const fetchFn = options.fetch ?? ((url, init) => fetch(url, init));
  return {
    name: model,
    async embed(texts, kind) {
      const vectors: number[][] = [];
      for (let start = 0; start < texts.length; start += BATCH) {
        const batch = texts.slice(start, start + BATCH);
        const response = await fetchFn(VOYAGE_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${options.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ input: batch, model, input_type: kind }),
        });
        if (!response.ok) throw new Error(`Voyage answered ${response.status}: ${await response.text()}`);
        const body = (await response.json()) as VoyageResponse;
        // Put them back in the order they were sent: the answer carries each one's index.
        const ordered = [...body.data].sort((a, b) => a.index - b.index);
        if (ordered.length !== batch.length) throw new Error(`Voyage sent ${ordered.length} embeddings for ${batch.length} texts`);
        vectors.push(...ordered.map((d) => d.embedding));
      }
      return vectors;
    },
  };
}

// --- An embedder with no model at all: for tests, and for trying things offline ---
// Every word (and pair of words) is hashed into one of `dimensions` slots. Texts that share words land
// in the same slots, so their vectors point the same way. It only knows words, not meanings: "refund"
// and "money back" look unrelated to it. That's exactly what a real model adds.

const STOP_WORDS = new Set(
  "a an and are as at be but by can do for from has have i if in is it my of on or so that the this to was we what when where who will with you your na ya wa kwa ni la za cha".split(" "),
);

// A very rough stemmer: "refunds", "refunded" and "refunding" all become "refund", so they count as
// the same word. Real stemmers are cleverer; this catches the common endings.
export function stem(word: string): string {
  for (const ending of ["ing", "ed", "es", "s"]) {
    if (word.length > ending.length + 3 && word.endsWith(ending)) return word.slice(0, -ending.length);
  }
  return word;
}

export function words(text: string): string[] {
  const plain = text.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, ""); // "café" -> "cafe"
  return (plain.match(/[a-z0-9]+/g) ?? []).filter((w) => !STOP_WORDS.has(w)).map(stem);
}

// FNV-1a: a small, fast, well-spread hash of a string to a 32-bit number.
export function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function hashingEmbedder(dimensions = 1024): Embedder {
  const embedOne = (text: string): number[] => {
    const vector = new Array<number>(dimensions).fill(0);
    const ws = words(text);
    const features = [...ws, ...ws.slice(1).map((w, i) => `${ws[i]} ${w}`)];
    for (const feature of features) {
      const hash = fnv1a(feature);
      vector[hash % dimensions] += hash & 0x80000000 ? -1 : 1; // a sign from another bit spreads collisions out
    }
    return vector;
  };
  return {
    name: `hashing-${dimensions}`,
    embed: async (texts) => texts.map(embedOne),
  };
}
