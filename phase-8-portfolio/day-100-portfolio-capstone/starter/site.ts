import { cover } from "./covers.ts";
import { THEME_CSS, favicon } from "./theme.ts";

// Your portfolio's generator: check the content, then turn it into pages. The tests are the spec.
// cover(), THEME_CSS and favicon() are written; use them. Zod (z) is a good fit for checking.

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

export interface Project {
  slug: string;
  title: string;
  summary: string;
  year: number;
  featured: boolean; // default false
  role?: string;
  tags: string[];
  links: { live?: string; source?: string };
  problem: string;
  approach: string;
  result: string;
  highlights: string[]; // default []
}

// Every problem at once, each starting with the project's slug (or "project 3" if it has none).
export function validateProjects(raw: unknown[]): { projects: Project[]; problems: string[] } {
  throw new Error(`TODO: validateProjects(${raw.length} projects)`);
}

// Featured first, in the order listed. Then the newest, then by title.
export function sortProjects(projects: Project[]): Project[] {
  throw new Error(`TODO: sortProjects(${projects.length})`);
}

// "Next.js" -> "next-js"
export function tagSlug(tag: string): string {
  throw new Error(`TODO: tagSlug(${tag})`);
}

export function tagCounts(projects: Project[]): { tag: string; slug: string; count: number }[] {
  throw new Error(`TODO: tagCounts(${projects.length})`);
}

export function filterProjects(projects: Project[], options: { tag?: string; query?: string } = {}): Project[] {
  throw new Error(`TODO: filterProjects(${projects.length}, ${JSON.stringify(options)})`);
}

export function relatedProjects(project: Project, all: Project[], limit = 3): Project[] {
  throw new Error(`TODO: relatedProjects(${project.slug}, ${all.length}, ${limit})`);
}

export function escapeHtml(text: string): string {
  throw new Error(`TODO: escapeHtml(${text})`);
}

export class ContentProblems extends Error {
  problems: string[];
  constructor(problems: string[]) {
    super(`Fix these first:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
    this.problems = problems;
  }
}

// Every file in the site, by path: index.html, projects/<slug>/index.html, tags/<slug>/index.html,
// 404.html, sitemap.xml, robots.txt, style.css, favicon.svg. Throws ContentProblems for bad content.
export function buildSite(site: SiteConfig, raw: unknown[]): Map<string, string> {
  throw new Error(`TODO: buildSite(${site.name}, ${raw.length}) with ${typeof cover}, ${THEME_CSS.length}, ${typeof favicon}`);
}
