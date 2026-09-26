export interface Post {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  tags: string[];
  summary: string;
  draft: boolean;
  html: string;
  readingMinutes: number;
}

export function slugify(text: string): string {
  throw new Error(`TODO: slugify(${text})`);
}

export function readingMinutes(markdown: string): number {
  throw new Error(`TODO: readingMinutes(${markdown.length} characters)`);
}

export function parseFrontMatter(source: string): { data: Record<string, string | string[] | boolean>; body: string } {
  throw new Error(`TODO: parseFrontMatter(${source.length} characters)`);
}

export function parsePost(fileName: string, source: string): Post {
  throw new Error(`TODO: parsePost(${fileName}, ${source.length} characters)`);
}
