import { escapeHtml } from "./markdown.ts";
import { THEME_CSS } from "./theme.ts";
import type { Post } from "./posts.ts";

export interface SiteConfig {
  title: string;
  description: string;
  url: string; // "https://amina.example": no trailing slash
  author: string;
}

// "2026-12-05" -> "5 December 2026"
export function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// Published posts, newest first; two on the same day keep a stable order, by title.
export function published(posts: Post[]): Post[] {
  return posts.filter((p) => !p.draft).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
}

// Pages link with paths relative to the site root, so "root" is how far up the root is from this page.
function page(config: SiteConfig, options: { title: string; description: string; root: string; body: string; canonical: string }): string {
  const fullTitle = options.title === config.title ? config.title : `${options.title} · ${config.title}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(options.description)}">
<link rel="canonical" href="${escapeHtml(config.url + options.canonical)}">
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(config.title)}" href="${options.root}feed.xml">
<link rel="stylesheet" href="${options.root}style.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%23b4441b'/></svg>">
</head>
<body>
<header class="site"><a class="brand" href="${options.root}index.html">${escapeHtml(config.title)}</a><a class="rss" href="${options.root}feed.xml">RSS</a></header>
<main>
${options.body}
</main>
<footer class="site">Written by ${escapeHtml(config.author)}. Built with a blog generator from 100 Days of TypeScript.</footer>
</body>
</html>
`;
}

function postList(posts: Post[], root: string): string {
  return `<ol class="posts">${posts
    .map(
      (p) => `
<li><article>
<h2><a href="${root}posts/${p.slug}/index.html">${escapeHtml(p.title)}</a></h2>
<p class="meta"><time datetime="${p.date}">${formatDate(p.date)}</time> · ${p.readingMinutes} min read</p>
<p>${escapeHtml(p.summary)}</p>
</article></li>`,
    )
    .join("")}
</ol>`;
}

function tagLinks(tags: string[], root: string): string {
  return tags.length ? `<ul class="tags">${tags.map((t) => `<li><a href="${root}tags/${t}/index.html">#${t}</a></li>`).join("")}</ul>` : "";
}

export function rss(posts: Post[], config: SiteConfig): string {
  const items = published(posts)
    .slice(0, 20)
    .map(
      (p) => `  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${escapeHtml(`${config.url}/posts/${p.slug}/`)}</link>
    <guid isPermaLink="true">${escapeHtml(`${config.url}/posts/${p.slug}/`)}</guid>
    <pubDate>${new Date(`${p.date}T12:00:00Z`).toUTCString()}</pubDate>
    <description>${escapeHtml(p.summary)}</description>
  </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeHtml(config.title)}</title>
  <link>${escapeHtml(config.url)}/</link>
  <description>${escapeHtml(config.description)}</description>
${items}
</channel>
</rss>
`;
}

// Every file of the site, by path.
export function buildSite(posts: Post[], config: SiteConfig): Map<string, string> {
  const live = published(posts);
  const slugs = new Set<string>();
  for (const p of live) {
    if (slugs.has(p.slug)) throw new Error(`Two posts would both be at posts/${p.slug}/`);
    slugs.add(p.slug);
  }

  const files = new Map<string, string>();
  files.set("style.css", THEME_CSS);
  files.set("feed.xml", rss(live, config));
  files.set("index.html", page(config, { title: config.title, description: config.description, root: "", canonical: "/", body: `<h1 class="intro">${escapeHtml(config.description)}</h1>\n${postList(live, "")}` }));

  for (const p of live) {
    files.set(
      `posts/${p.slug}/index.html`,
      page(config, {
        title: p.title,
        description: p.summary,
        root: "../../",
        canonical: `/posts/${p.slug}/`,
        body: `<article class="post">
<header>
<p class="meta"><time datetime="${p.date}">${formatDate(p.date)}</time> · ${p.readingMinutes} min read</p>
<h1>${escapeHtml(p.title)}</h1>
${tagLinks(p.tags, "../../")}
</header>
<div class="prose">
${p.html}
</div>
</article>
<p class="back"><a href="../../index.html">← All posts</a></p>`,
      }),
    );
  }

  const tags = [...new Set(live.flatMap((p) => p.tags))].sort();
  for (const tag of tags) {
    files.set(
      `tags/${tag}/index.html`,
      page(config, { title: `#${tag}`, description: `Posts tagged ${tag}`, root: "../../", canonical: `/tags/${tag}/`, body: `<h1 class="intro">Posts tagged #${escapeHtml(tag)}</h1>\n${postList(live.filter((p) => p.tags.includes(tag)), "../../")}` }),
    );
  }
  return files;
}
