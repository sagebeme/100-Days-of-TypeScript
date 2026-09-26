import { markdownToHtml, plainText } from "./markdown.ts";

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

// "Nairobi's Best Nyama Choma (2026)!" -> "nairobis-best-nyama-choma-2026"
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// At 200 words a minute, rounded up, and never less than 1.
export function readingMinutes(markdown: string): number {
  const words = plainText(markdown).split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

// The block between two --- lines at the top: "key: value" lines, with [a, b] lists and true/false.
export function parseFrontMatter(source: string): { data: Record<string, string | string[] | boolean>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) return { data: {}, body: source };
  const data: Record<string, string | string[] | boolean> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = /^([\w-]+):\s*(.*)$/.exec(line.trim());
    if (!pair) continue;
    const raw = pair[2].trim();
    if (/^\[.*\]$/.test(raw)) data[pair[1]] = raw.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    else if (raw === "true" || raw === "false") data[pair[1]] = raw === "true";
    else data[pair[1]] = raw.replace(/^["']|["']$/g, "");
  }
  return { data, body: source.slice(match[0].length) };
}

export function parsePost(fileName: string, source: string): Post {
  const { data, body } = parseFrontMatter(source);
  const title = typeof data.title === "string" && data.title ? data.title : fileName.replace(/\.md$/, "");
  const date = typeof data.date === "string" ? data.date : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error(`${fileName}: date must look like 2026-12-05`);
  const text = plainText(body);
  return {
    slug: typeof data.slug === "string" && data.slug ? slugify(data.slug) : slugify(title),
    title,
    date,
    tags: Array.isArray(data.tags) ? data.tags.map((t) => slugify(t)) : [],
    summary: typeof data.summary === "string" ? data.summary : text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, "")}…` : text,
    draft: data.draft === true,
    html: markdownToHtml(body),
    readingMinutes: readingMinutes(body),
  };
}
