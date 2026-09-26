import { embeddingText, type Chunk } from "./chunks.ts";
import type { Embedder } from "./embedders.ts";

// How alike two vectors are, by the angle between them: 1 is the same direction, 0 is unrelated.
// Length doesn't count, only direction, so a long page and a short question can still match.
// TODO: dot(a, b) / (length(a) × length(b)). Throw if they're different sizes. 0 if either is all zeros.
export function cosine(a: number[], b: number[]): number {
  void [a, b];
  return 0;
}

export interface Index {
  embedder: Embedder;
  chunks: Chunk[];
  vectors: number[][];
}

// Embed every chunk once, ahead of time. Questions are embedded as they arrive.
// TODO: embed every chunk's embeddingText() once, as "document"s.
export async function buildIndex(embedder: Embedder, chunks: Chunk[]): Promise<Index> {
  void embeddingText;
  return { embedder, chunks, vectors: [] };
}

export interface Hit {
  chunk: Chunk;
  score: number;
}

// The k chunks most like the question, best first, leaving out any that score under minScore:
// three weak matches are worse than none, because the model will try to use them.
// TODO: embed the question as a "query", score every chunk with cosine(), drop those under minScore,
// and return the best k, best first.
export async function search(index: Index, question: string, k = 3, minScore = 0.1): Promise<Hit[]> {
  void [index, question, k, minScore];
  return [];
}
