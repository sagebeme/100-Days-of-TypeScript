import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// The link store: SQLite through Node's built-in driver. Plain SQL, parameters always bound, never
// glued into the query (Day 64).

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/; // 3 to 30, no dash at either end
export const RESERVED = new Set(["api", "admin", "stats", "static", "assets", "health", "login", "new", "about"]);
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no l/1 or o/0: easy to read out loud

export interface Link {
  slug: string;
  url: string;
  createdAt: string;
  clicks: number;
}

export function openLinks(path = ":memory:") {
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      slug TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clicks (
      slug TEXT NOT NULL REFERENCES links(slug) ON DELETE CASCADE,
      at TEXT NOT NULL,
      referrer TEXT -- just the site, like "twitter.com"; never the full address, never an IP
    );
    CREATE INDEX IF NOT EXISTS clicks_by_slug ON clicks (slug, at);
    PRAGMA foreign_keys = ON;
  `);
  return db;
}

export type LinkDb = ReturnType<typeof openLinks>;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// What's wrong with a URL, or null. Only http and https (a javascript: link would run code on click),
// no links to the shortener itself (a loop), and a sensible length.
export function urlProblem(raw: string, ownHost: string): string | null {
  if (!raw.trim()) return "Paste the link you want to shorten";
  if (raw.length > 2000) return "That link is too long";
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return "That isn't a complete link. It should start with https://";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return "Only http and https links can be shortened";
  if (url.hostname === ownHost) return "That's already a short link";
  if (!url.hostname.includes(".") && url.hostname !== "localhost") return "That link's address looks incomplete";
  return null;
}

export function slugProblem(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) return "Use 3 to 30 lowercase letters, numbers and dashes, not starting or ending with a dash";
  if (RESERVED.has(slug)) return `"${slug}" is reserved`;
  return null;
}

export function randomSlug(length = 6): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export class SlugTaken extends Error {}

// Saves a link. Returns the manage token: shown once, stored only as a hash, so a leaked database
// can't be used to delete or read other people's links.
export function createLink(db: LinkDb, url: string, slug: string | null, now: Date): { slug: string; token: string } {
  const token = randomBytes(24).toString("base64url");
  const insert = db.prepare("INSERT INTO links (slug, url, token_hash, created_at) VALUES (?, ?, ?, ?)");
  if (slug) {
    try {
      insert.run(slug, url, hash(token), now.toISOString());
    } catch {
      throw new SlugTaken(`"${slug}" is taken`);
    }
    return { slug, token };
  }
  // A random slug might collide; with 32^6 possibilities that's rare, so a few tries is plenty.
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = randomSlug(6 + Math.floor(attempt / 2));
    try {
      insert.run(candidate, url, hash(token), now.toISOString());
      return { slug: candidate, token };
    } catch {
      // taken: try another
    }
  }
  throw new Error("Couldn't find a free short link");
}

export function findLink(db: LinkDb, slug: string): { url: string; tokenHash: string } | null {
  const row = db.prepare("SELECT url, token_hash FROM links WHERE slug = ?").get(slug) as { url: string; token_hash: string } | undefined;
  return row ? { url: row.url, tokenHash: row.token_hash } : null;
}

export function ownsLink(db: LinkDb, slug: string, token: string): boolean {
  const link = findLink(db, slug);
  if (!link) return false;
  const given = Buffer.from(hash(token));
  const expected = Buffer.from(link.tokenHash);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Only the referring site's name is kept: "https://www.twitter.com/some/post?x=1" -> "twitter.com".
export function referrerSite(header: string | undefined): string | null {
  if (!header) return null;
  try {
    return new URL(header).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function recordClick(db: LinkDb, slug: string, referrer: string | null, now: Date): void {
  db.prepare("INSERT INTO clicks (slug, at, referrer) VALUES (?, ?, ?)").run(slug, now.toISOString(), referrer);
}

export interface Stats {
  slug: string;
  url: string;
  clicks: number;
  lastSevenDays: { day: string; clicks: number }[]; // oldest first, days with no clicks included
  topReferrers: { site: string; clicks: number }[]; // at most 5; "direct" when there was none
}

export function linkStats(db: LinkDb, slug: string, now: Date): Stats | null {
  const link = findLink(db, slug);
  if (!link) return null;
  const { total } = db.prepare("SELECT count(*) AS total FROM clicks WHERE slug = ?").get(slug) as { total: number };
  const days = Array.from({ length: 7 }, (_, i) => new Date(now.getTime() - (6 - i) * 86_400_000).toISOString().slice(0, 10));
  const counts = new Map(
    (db.prepare("SELECT substr(at, 1, 10) AS day, count(*) AS n FROM clicks WHERE slug = ? AND at >= ? GROUP BY day").all(slug, days[0]) as { day: string; n: number }[]).map((r) => [r.day, r.n]),
  );
  const referrers = db
    .prepare("SELECT coalesce(referrer, 'direct') AS site, count(*) AS clicks FROM clicks WHERE slug = ? GROUP BY site ORDER BY clicks DESC, site LIMIT 5")
    .all(slug) as { site: string; clicks: number }[];
  return { slug, url: link.url, clicks: total, lastSevenDays: days.map((day) => ({ day, clicks: counts.get(day) ?? 0 })), topReferrers: referrers.map((r) => ({ ...r })) };
}

export function deleteLink(db: LinkDb, slug: string): void {
  db.prepare("DELETE FROM clicks WHERE slug = ?").run(slug);
  db.prepare("DELETE FROM links WHERE slug = ?").run(slug);
}
