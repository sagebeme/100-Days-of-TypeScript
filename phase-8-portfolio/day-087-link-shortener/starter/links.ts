import { DatabaseSync } from "node:sqlite";

// The link store. The tests are the spec.
export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;
export const RESERVED = new Set(["api", "admin", "stats", "static", "assets", "health", "login", "new", "about"]);

export interface Stats {
  slug: string;
  url: string;
  clicks: number;
  lastSevenDays: { day: string; clicks: number }[];
  topReferrers: { site: string; clicks: number }[];
}

export class SlugTaken extends Error {}

export function openLinks(path = ":memory:"): DatabaseSync {
  return new DatabaseSync(path); // TODO: create the tables
}

export type LinkDb = ReturnType<typeof openLinks>;

export function urlProblem(raw: string, ownHost: string): string | null {
  throw new Error(`TODO: urlProblem(${raw}, ${ownHost})`);
}

export function slugProblem(slug: string): string | null {
  throw new Error(`TODO: slugProblem(${slug})`);
}

export function randomSlug(length = 6): string {
  throw new Error(`TODO: randomSlug(${length})`);
}

export function createLink(db: LinkDb, url: string, slug: string | null, now: Date): { slug: string; token: string } {
  throw new Error(`TODO: createLink(${typeof db}, ${url}, ${slug}, ${now.toISOString()})`);
}

export function findLink(db: LinkDb, slug: string): { url: string; tokenHash: string } | null {
  throw new Error(`TODO: findLink(${typeof db}, ${slug})`);
}

export function ownsLink(db: LinkDb, slug: string, token: string): boolean {
  throw new Error(`TODO: ownsLink(${typeof db}, ${slug}, ${token.length})`);
}

export function referrerSite(header: string | undefined): string | null {
  throw new Error(`TODO: referrerSite(${header})`);
}

export function recordClick(db: LinkDb, slug: string, referrer: string | null, now: Date): void {
  throw new Error(`TODO: recordClick(${typeof db}, ${slug}, ${referrer}, ${now.toISOString()})`);
}

export function linkStats(db: LinkDb, slug: string, now: Date): Stats | null {
  throw new Error(`TODO: linkStats(${typeof db}, ${slug}, ${now.toISOString()})`);
}

export function deleteLink(db: LinkDb, slug: string): void {
  throw new Error(`TODO: deleteLink(${typeof db}, ${slug})`);
}
