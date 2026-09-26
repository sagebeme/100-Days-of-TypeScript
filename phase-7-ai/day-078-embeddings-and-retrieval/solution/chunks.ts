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
export function chunkPage(page: HelpPage, maxChars = 300): Chunk[] {
  const paragraphs = page.text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const pieces: string[] = [];
  for (const paragraph of paragraphs) {
    const last = pieces.at(-1);
    if (last !== undefined && last.length + 1 + paragraph.length <= maxChars) pieces[pieces.length - 1] = `${last} ${paragraph}`;
    else pieces.push(paragraph);
  }
  return pieces.map((text, i) => ({ id: `${page.id}#${i + 1}`, pageId: page.id, title: page.title, text }));
}

export function chunkAll(pages: HelpPage[], maxChars?: number): Chunk[] {
  return pages.flatMap((page) => chunkPage(page, maxChars));
}

// What gets embedded: the title too, because "Refunds" says what a paragraph is about even when the
// paragraph itself never uses the word.
export function embeddingText(chunk: Chunk): string {
  return `${chunk.title}\n${chunk.text}`;
}
