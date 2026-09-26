import type { HelpPage } from "./help-centre.ts";

export interface Chunk {
  id: string; // "refunds#2": the page, and which piece of it
  pageId: string;
  title: string;
  text: string;
}

// A whole page is too much to match against one question ("what if my event is cancelled?" is about
// one paragraph of the refunds page), so pages are cut into pieces. Paragraphs are natural pieces;
// short ones are joined so no piece is too small to mean anything, up to maxChars.
// TODO: split page.text at blank lines into paragraphs (tidy each one: runs of spaces and newlines
// become one space, and trim). Join a paragraph onto the piece before it (with a space) if the result
// still fits in maxChars; otherwise it starts a new piece. Number the pieces from 1: "refunds#1".
export function chunkPage(page: HelpPage, maxChars = 300): Chunk[] {
  void [page, maxChars];
  return [];
}

export function chunkAll(pages: HelpPage[], maxChars?: number): Chunk[] {
  return pages.flatMap((page) => chunkPage(page, maxChars));
}

// What gets embedded: the title too, because "Refunds" says what a paragraph is about even when the
// paragraph itself never uses the word.
export function embeddingText(chunk: Chunk): string {
  return `${chunk.title}\n${chunk.text}`;
}
