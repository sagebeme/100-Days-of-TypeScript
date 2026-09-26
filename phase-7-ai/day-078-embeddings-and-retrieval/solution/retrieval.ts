import { embeddingText, type Chunk } from "./chunks.ts";
import type { Embedder } from "./embedders.ts";

// How alike two vectors are, by the angle between them: 1 is the same direction, 0 is unrelated.
// Length doesn't count, only direction, so a long page and a short question can still match.
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error(`Vectors of different sizes: ${a.length} and ${b.length}`);
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return aa === 0 || bb === 0 ? 0 : dot / Math.sqrt(aa * bb);
}

export interface Index {
  embedder: Embedder;
  chunks: Chunk[];
  vectors: number[][];
}

// Embed every chunk once, ahead of time. Questions are embedded as they arrive.
export async function buildIndex(embedder: Embedder, chunks: Chunk[]): Promise<Index> {
  const vectors = await embedder.embed(chunks.map(embeddingText), "document");
  return { embedder, chunks, vectors };
}

export interface Hit {
  chunk: Chunk;
  score: number;
}

// The k chunks most like the question, best first, leaving out any that score under minScore:
// three weak matches are worse than none, because the model will try to use them.
export async function search(index: Index, question: string, k = 3, minScore = 0.1): Promise<Hit[]> {
  const [query] = await index.embedder.embed([question], "query");
  return index.chunks
    .map((chunk, i) => ({ chunk, score: cosine(query, index.vectors[i]) }))
    .filter((hit) => hit.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
