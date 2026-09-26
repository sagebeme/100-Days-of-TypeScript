import { z } from "zod";
import { cover } from "./covers.ts";
import { THEME_CSS, favicon } from "./theme.ts";

export interface SiteConfig {
  name: string;
  role: string;
  location: string;
  url: string; // absolute, no trailing slash
  basePath: string; // "/" or "/portfolio/"
  email: string;
  github: string;
  intro: string;
  about: string[];
}

export const MAX_SUMMARY = 160; // about what search results show before cutting off
export const MAX_FEATURED = 3;

const https = z.url({ protocol: /^https$/, error: "must be an https:// address" });

export const ProjectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'slug must be lower-case words joined by dashes, like "matatu-routes"'),
  title: z.string().trim().min(1, "needs a title").max(60, "title is too long for a card (60 characters at most)"),
  summary: z
    .string()
    .trim()
    .min(20, "summary is too short to tell anyone anything")
    .max(MAX_SUMMARY, { error: (issue) => `summary is ${String(issue.input).length} characters: keep it to ${MAX_SUMMARY}, or search results cut it off` }),
  year: z.int().min(2000).max(2100),
  featured: z.boolean().default(false),
  role: z.string().trim().min(1).optional(),
  tags: z.array(z.string().trim().min(1)).min(1, "needs at least one tag").max(6, "at most 6 tags: pick the ones that matter"),
  links: z
    .object({ live: https.optional(), source: https.optional() })
    .refine((l) => l.live || l.source, "give at least one link: live or source"),
  problem: z.string().trim().min(1, "say what problem it solves"),
  approach: z.string().trim().min(1, "say what you built, and how"),
  result: z.string().trim().min(1, "say how it went"),
  highlights: z.array(z.string().trim().min(1)).default([]),
});

export type Project = z.infer<typeof ProjectSchema>;

// Every problem at once, each one saying which project and what to do.
export function validateProjects(raw: unknown[]): { projects: Project[]; problems: string[] } {
  const projects: Project[] = [];
  const problems: string[] = [];
  raw.forEach((item, i) => {
    const slug = typeof (item as { slug?: unknown })?.slug === "string" ? (item as { slug: string }).slug : `project ${i + 1}`;
    const result = ProjectSchema.safeParse(item);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const where = issue.path.length && !issue.message.startsWith(String(issue.path[0])) ? `${issue.path.join(".")}: ` : "";
        problems.push(`${slug}: ${where}${issue.message}`);
      }
      return;
    }
    if (projects.some((p) => p.slug === result.data.slug)) problems.push(`"${result.data.slug}" is used by two projects: slugs are URLs, so they must be unique`);
    else projects.push(result.data);
  });
  const featured = projects.filter((p) => p.featured).length;
  if (featured > MAX_FEATURED) problems.push(`feature at most ${MAX_FEATURED} projects: ${featured} are featured, and when everything stands out nothing does`);
  return { projects, problems };
}

// Featured first, in the order you listed them (you choose what leads). Then the newest, then by title.
export function sortProjects(projects: Project[]): Project[] {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured).sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  return [...featured, ...rest];
}

// "Next.js" -> "next-js", "Open source" -> "open-source"
export function tagSlug(tag: string): string {
  return tag
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-");
}

// Most used first, then alphabetical. Tags that differ only in case are the same tag.
export function tagCounts(projects: Project[]): { tag: string; slug: string; count: number }[] {
  const counts = new Map<string, { tag: string; slug: string; count: number }>();
  for (const project of projects) {
    for (const tag of new Set(project.tags.map((t) => t.trim()))) {
      const slug = tagSlug(tag);
      const entry = counts.get(slug);
      if (entry) entry.count++;
      else counts.set(slug, { tag, slug, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function filterProjects(projects: Project[], { tag, query }: { tag?: string; query?: string } = {}): Project[] {
  const words = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
  return projects.filter((p) => {
    if (tag && !p.tags.some((t) => tagSlug(t) === tagSlug(tag))) return false;
    const text = [p.title, p.summary, ...p.tags].join(" ").toLowerCase();
    return words.every((w) => text.includes(w));
  });
}

// The projects sharing the most tags with this one, then the newest. Never itself.
export function relatedProjects(project: Project, all: Project[], limit = 3): Project[] {
  const mine = new Set(project.tags.map(tagSlug));
  return all
    .filter((p) => p.slug !== project.slug)
    .map((p) => ({ p, shared: p.tags.filter((t) => mine.has(tagSlug(t))).length }))
    .filter(({ shared }) => shared > 0)
    .sort((a, b) => b.shared - a.shared || b.p.year - a.p.year || a.p.title.localeCompare(b.p.title))
    .slice(0, limit)
    .map(({ p }) => p);
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}

// Paths inside the site, as the browser needs them ("/portfolio/projects/neno/"), and as the rest of
// the world does ("https://neema.github.io/portfolio/projects/neno/").
export const href = (site: SiteConfig, path: string) => site.basePath.replace(/\/?$/, "/") + path.replace(/^\//, "");
export const absolute = (site: SiteConfig, path: string) => site.url.replace(/\/$/, "") + href(site, path);

interface PageOptions {
  title: string | null; // null: the home page, which is just the name
  description: string;
  path: string;
  body: string;
  type?: "website" | "article";
  noindex?: boolean;
}

export function layout(site: SiteConfig, page: PageOptions): string {
  const title = page.title ? `${page.title} · ${site.name}` : `${site.name}: ${site.role}`;
  const e = escapeHtml;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(page.description)}">
${page.noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${e(absolute(site, page.path))}">`}
<meta property="og:type" content="${page.type ?? "website"}">
<meta property="og:title" content="${e(page.title ?? site.name)}">
<meta property="og:description" content="${e(page.description)}">
<meta property="og:url" content="${e(absolute(site, page.path))}">
<meta property="og:site_name" content="${e(site.name)}">
<meta name="twitter:card" content="summary">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="${href(site, "favicon.svg")}" type="image/svg+xml">
<link rel="stylesheet" href="${href(site, "style.css")}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><div class="wrap">
<a class="brand" href="${href(site, "")}">${e(site.name)}</a>
<nav aria-label="Main"><a href="${href(site, "")}#work">Work</a><a href="${href(site, "")}#about">About</a><a href="mailto:${e(site.email)}">Contact</a></nav>
</div></header>
<main id="main">
${page.body}
</main>
<footer class="site"><div class="wrap">
<p class="cta">Got a project, or a role? <a href="mailto:${e(site.email)}">${e(site.email)}</a></p>
<p class="small"><a href="${e(site.github)}">GitHub</a> · ${e(site.location)} · Built with TypeScript, and no JavaScript sent to your browser.</p>
</div></footer>
</body>
</html>
`;
}

const tagList = (site: SiteConfig, tags: string[], linked: boolean) =>
  `<ul class="tags">${tags.map((t) => `<li>${linked ? `<a href="${href(site, `tags/${tagSlug(t)}/`)}">${escapeHtml(t)}</a>` : escapeHtml(t)}</li>`).join("")}</ul>`;

function card(site: SiteConfig, p: Project, headingLevel: 2 | 3 = 3): string {
  const h = `h${headingLevel}`;
  return `<li class="card">${cover(p.slug, p.title)}<div class="card-body"><${h}><a href="${href(site, `projects/${p.slug}/`)}">${escapeHtml(p.title)}</a></${h}><p>${escapeHtml(p.summary)}</p>${tagList(site, p.tags, false)}</div></li>`;
}

function filters(site: SiteConfig, projects: Project[], current: string | null): string {
  const all = `<a href="${href(site, "")}#all"${current === null ? ' aria-current="page"' : ""}>All <span>${projects.length}</span></a>`;
  const tags = tagCounts(projects).map(
    ({ tag, slug, count }) => `<a href="${href(site, `tags/${slug}/`)}"${current === slug ? ' aria-current="page"' : ""}>${escapeHtml(tag)} <span>${count}</span></a>`,
  );
  return `<nav class="filters" aria-label="Filter projects by tag">${[all, ...tags].join("")}</nav>`;
}

function list(site: SiteConfig, projects: Project[]): string {
  return `<ul class="list">${projects
    .map((p) => `<li><span class="year">${p.year}</span><div><h3><a href="${href(site, `projects/${p.slug}/`)}">${escapeHtml(p.title)}</a></h3><p>${escapeHtml(p.summary)}</p></div></li>`)
    .join("")}</ul>`;
}

export function indexPage(site: SiteConfig, projects: Project[]): string {
  const sorted = sortProjects(projects);
  const featured = sorted.filter((p) => p.featured);
  const e = escapeHtml;
  const body = `<section class="hero wrap">
<p class="eyebrow">${e(site.role)} · ${e(site.location)}</p>
<h1>${e(site.name)}</h1>
<p class="lede">${e(site.intro)}</p>
<p class="actions"><a class="button" href="mailto:${e(site.email)}">Email me</a><a class="button quiet" href="${e(site.github)}">GitHub</a></p>
</section>
${featured.length ? `<section class="wrap" id="work" aria-labelledby="work-title"><h2 id="work-title">Selected work</h2><ul class="cards">${featured.map((p) => card(site, p)).join("")}</ul></section>` : ""}
<section class="wrap" id="all" aria-labelledby="all-title"><h2 id="all-title">${featured.length ? "Everything I've built" : "Work"}</h2>
${filters(site, projects, null)}
${list(site, sorted)}
</section>
<section class="wrap about" id="about" aria-labelledby="about-title"><h2 id="about-title">About</h2><div class="prose">${site.about.map((p) => `<p>${e(p)}</p>`).join("")}</div></section>`;
  return layout(site, { title: null, description: site.intro, path: "", body });
}

export function projectPage(site: SiteConfig, project: Project, all: Project[]): string {
  const e = escapeHtml;
  const related = relatedProjects(project, all);
  const links = [
    project.links.live ? `<a class="button" href="${e(project.links.live)}">Visit the live site <span aria-hidden="true">↗</span></a>` : "",
    project.links.source ? `<a class="button${project.links.live ? " quiet" : ""}" href="${e(project.links.source)}">Source code <span aria-hidden="true">↗</span></a>` : "",
  ].join("");
  const body = `<article class="project wrap">
<p class="crumbs"><a href="${href(site, "")}#work">← All work</a></p>
<header>
<p class="eyebrow">${project.year}${project.role ? ` · ${e(project.role)}` : ""}</p>
<h1>${e(project.title)}</h1>
<p class="lede">${e(project.summary)}</p>
${tagList(site, project.tags, true)}
<p class="actions">${links}</p>
</header>
<figure class="hero-cover">${cover(project.slug, project.title)}</figure>
<div class="story">
<section><h2>The problem</h2><p>${e(project.problem)}</p></section>
<section><h2>What I built</h2><p>${e(project.approach)}</p></section>
<section><h2>How it went</h2><p>${e(project.result)}</p></section>
</div>
${project.highlights.length ? `<section class="highlights"><h2>Highlights</h2><ul>${project.highlights.map((h) => `<li>${e(h)}</li>`).join("")}</ul></section>` : ""}
</article>
${related.length ? `<section class="wrap related" aria-labelledby="related-title"><h2 id="related-title">Related work</h2><ul class="cards">${related.map((p) => card(site, p)).join("")}</ul></section>` : ""}`;
  return layout(site, { title: project.title, description: project.summary, path: `projects/${project.slug}/`, body, type: "article" });
}

export function tagPage(site: SiteConfig, tag: { tag: string; slug: string }, projects: Project[]): string {
  const tagged = sortProjects(filterProjects(projects, { tag: tag.slug }));
  const count = tagged.length === 1 ? "1 project" : `${tagged.length} projects`;
  const body = `<section class="wrap tag-page">
<p class="crumbs"><a href="${href(site, "")}#all">← All work</a></p>
<h1>${escapeHtml(tag.tag)} <span class="count">${count}</span></h1>
${filters(site, projects, tag.slug)}
${list(site, tagged)}
</section>`;
  return layout(site, { title: `${tag.tag} projects`, description: `${count} by ${site.name} using ${tag.tag}.`, path: `tags/${tag.slug}/`, body });
}

export function notFoundPage(site: SiteConfig): string {
  const body = `<section class="wrap not-found"><p class="eyebrow">404</p><h1>That page isn't here.</h1><p class="lede">It may have moved when I tidied up. Everything I've built is on the <a href="${href(site, "")}#all">home page</a>.</p></section>`;
  return layout(site, { title: "Not found", description: "This page doesn't exist.", path: "404.html", body, noindex: true });
}

export function sitemap(site: SiteConfig, projects: Project[]): string {
  const paths = ["", ...sortProjects(projects).map((p) => `projects/${p.slug}/`), ...tagCounts(projects).map((t) => `tags/${t.slug}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${escapeHtml(absolute(site, p))}</loc></url>`).join("\n")}
</urlset>
`;
}

export class ContentProblems extends Error {
  problems: string[];
  constructor(problems: string[]) {
    super(`Fix these first:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.problems = problems;
  }
}

// Every file in the site, by path. Refuses to build from content with problems.
export function buildSite(site: SiteConfig, raw: unknown[]): Map<string, string> {
  const { projects, problems } = validateProjects(raw);
  if (problems.length) throw new ContentProblems(problems);
  const files = new Map<string, string>();
  files.set("index.html", indexPage(site, projects));
  for (const project of projects) files.set(`projects/${project.slug}/index.html`, projectPage(site, project, projects));
  for (const tag of tagCounts(projects)) files.set(`tags/${tag.slug}/index.html`, tagPage(site, tag, projects));
  files.set("404.html", notFoundPage(site));
  files.set("sitemap.xml", sitemap(site, projects));
  files.set("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${absolute(site, "sitemap.xml")}\n`);
  files.set("style.css", THEME_CSS);
  files.set("favicon.svg", favicon(site.name));
  return files;
}
