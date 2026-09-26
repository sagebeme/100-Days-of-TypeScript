import type { Post } from "./posts.ts";

export interface SiteConfig {
  title: string;
  description: string;
  url: string; // "https://amina.example": no trailing slash
  author: string;
}

export function formatDate(date: string): string {
  throw new Error(`TODO: formatDate(${date})`);
}

export function published(posts: Post[]): Post[] {
  throw new Error(`TODO: published(${posts.length} posts)`);
}

export function rss(posts: Post[], config: SiteConfig): string {
  throw new Error(`TODO: rss(${posts.length} posts, ${config.title})`);
}

// Every file of the site, by path: "index.html", "posts/<slug>/index.html", "tags/<tag>/index.html",
// "feed.xml" and "style.css" (THEME_CSS from theme.ts, or your own).
export function buildSite(posts: Post[], config: SiteConfig): Map<string, string> {
  throw new Error(`TODO: buildSite(${posts.length} posts, ${config.title})`);
}
