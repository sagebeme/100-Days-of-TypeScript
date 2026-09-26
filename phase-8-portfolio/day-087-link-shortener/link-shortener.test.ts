import { describe, it, expect } from "vitest";
import { openLinks, urlProblem, slugProblem, randomSlug, referrerSite, createLink, ownsLink } from "./starter/links.ts";
import { createApp } from "./starter/app.ts";

const BASE = "https://fupi.example";

function setup(options: { createPerMinute?: number } = {}) {
  let clock = new Date("2026-12-05T09:00:00Z");
  const db = openLinks();
  const app = createApp({ db, baseUrl: BASE, now: () => clock, ...options });
  const shorten = (body: unknown, headers: Record<string, string> = {}) =>
    app.request("/api/links", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  const later = (ms: number) => void (clock = new Date(clock.getTime() + ms));
  return { app, db, shorten, later };
}

describe("checking links and endings", () => {
  it("only shortens complete http and https links, and never its own", () => {
    expect(urlProblem("https://tikiti.example/events/2", "fupi.example")).toBeNull();
    expect(urlProblem("http://localhost:3000/x", "fupi.example")).toBeNull();
    expect(urlProblem("", "fupi.example")).toMatch(/Paste/);
    expect(urlProblem("tikiti.example/events", "fupi.example")).toMatch(/complete link/);
    expect(urlProblem("javascript:alert(1)", "fupi.example")).toMatch(/http and https/);
    expect(urlProblem("ftp://files.example/x", "fupi.example")).toMatch(/http and https/);
    expect(urlProblem("https://fupi.example/abc", "fupi.example")).toMatch(/already a short link/);
    expect(urlProblem(`https://x.example/${"a".repeat(2001)}`, "fupi.example")).toMatch(/too long/);
  });

  it("takes custom endings of 3 to 30 lowercase letters, numbers and dashes, and not reserved words", () => {
    for (const ok of ["gengetone", "day-2", "abc", "a".repeat(30)]) expect(slugProblem(ok)).toBeNull();
    for (const bad of ["ab", "a".repeat(31), "-start", "end-", "Caps", "with space", "emoji😀"]) expect(slugProblem(bad)).toMatch(/3 to 30/);
    expect(slugProblem("admin")).toMatch(/reserved/);
  });

  it("makes random endings that are easy to read out loud", () => {
    const slugs = Array.from({ length: 200 }, () => randomSlug());
    expect(slugs.every((s) => /^[a-km-np-z2-9]{6}$/.test(s))).toBe(true); // no l, o, 0 or 1
    expect(new Set(slugs).size).toBeGreaterThan(190);
  });

  it("keeps only the referring site's name", () => {
    expect(referrerSite("https://www.twitter.com/some/post?utm=1")).toBe("twitter.com");
    expect(referrerSite(undefined)).toBeNull();
    expect(referrerSite("not a url")).toBeNull();
  });

  it("stores only a hash of the manage key", () => {
    const db = openLinks();
    const { slug, token } = createLink(db, "https://x.example", "mine", new Date());
    const row = db.prepare("SELECT token_hash FROM links WHERE slug = ?").get(slug) as { token_hash: string };
    expect(row.token_hash).not.toContain(token);
    expect(ownsLink(db, "mine", token)).toBe(true);
    expect(ownsLink(db, "mine", "guess")).toBe(false);
  });
});

describe("the API", () => {
  it("makes a short link with a random ending, and a key to manage it", async () => {
    const { shorten } = setup();
    const response = await shorten({ url: "https://tikiti.example/events/2" });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({ url: "https://tikiti.example/events/2", shortUrl: `${BASE}/${body.slug}` });
    expect(body.slug).toMatch(/^[a-z2-9]{6}$/);
    expect(body.token.length).toBeGreaterThanOrEqual(20);
  });

  it("uses your own ending, in lowercase, if it's free", async () => {
    const { shorten } = setup();
    expect((await (await shorten({ url: "https://x.example", slug: "Gengetone" })).json()).slug).toBe("gengetone");
    const taken = await shorten({ url: "https://y.example", slug: "gengetone" });
    expect([taken.status, (await taken.json()).error]).toEqual([409, '"gengetone" is taken']);
  });

  it("explains what's wrong with a bad request", async () => {
    const { shorten } = setup();
    for (const [body, pattern] of [
      [{ url: "javascript:alert(1)" }, /http and https/],
      [{ url: `${BASE}/abc` }, /already a short link/],
      [{ url: "https://x.example", slug: "api" }, /reserved/],
      [{}, /Paste/],
    ] as const) {
      const response = await shorten(body);
      expect(response.status).toBe(422);
      expect((await response.json()).error).toMatch(pattern);
    }
  });

  it("limits how many links one client makes a minute", async () => {
    const { shorten, later } = setup({ createPerMinute: 2 });
    const from = (ip: string) => shorten({ url: "https://x.example" }, { "x-forwarded-for": ip });
    expect([(await from("1.1.1.1")).status, (await from("1.1.1.1")).status, (await from("1.1.1.1")).status]).toEqual([201, 201, 429]);
    expect((await from("2.2.2.2")).status).toBe(201);
    later(60_000);
    expect((await from("1.1.1.1")).status).toBe(201);
  });
});

describe("redirecting", () => {
  it("sends people on with a 302, so every click is counted", async () => {
    const { app, shorten } = setup();
    await shorten({ url: "https://tikiti.example/events/2", slug: "gengetone" });
    const response = await app.request("/gengetone", { headers: { Referer: "https://www.whatsapp.com/chat" } });
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("https://tikiti.example/events/2");
    expect(response.headers.get("Cache-Control")).toContain("max-age=0");
    expect((await app.request("/GENGETONE")).status).toBe(302);
  });

  it("shows a friendly 404 page for a link that doesn't exist", async () => {
    const { app } = setup();
    const response = await app.request("/nope123");
    expect(response.status).toBe(404);
    expect(await response.text()).toContain("doesn't exist");
  });

  it("serves the home page", async () => {
    const { app } = setup();
    const page = await (await app.request("/")).text();
    expect(page).toContain("<form");
    expect(page).toContain('lang="en"');
  });
});

describe("stats and deleting", () => {
  async function withClicks() {
    const world = setup();
    const { token } = await (await world.shorten({ url: "https://tikiti.example", slug: "tikiti" })).json();
    for (const referer of ["https://www.whatsapp.com/", "https://twitter.com/a", "https://whatsapp.com/b", ""]) {
      await world.app.request("/tikiti", referer ? { headers: { Referer: referer } } : {});
    }
    world.later(2 * 86_400_000);
    await world.app.request("/tikiti");
    const auth = (key: string) => ({ headers: { Authorization: `Bearer ${key}` } });
    return { ...world, token, auth };
  }

  it("shows the owner the clicks, by day and by site", async () => {
    const { app, token, auth } = await withClicks();
    const stats = await (await app.request("/api/links/tikiti/stats", auth(token))).json();
    expect(stats.clicks).toBe(5);
    expect(stats.lastSevenDays).toHaveLength(7);
    expect(stats.lastSevenDays.at(-1)).toEqual({ day: "2026-12-07", clicks: 1 });
    expect(stats.lastSevenDays.at(-3)).toEqual({ day: "2026-12-05", clicks: 4 });
    expect(stats.topReferrers).toEqual([
      { site: "direct", clicks: 2 },
      { site: "whatsapp.com", clicks: 2 },
      { site: "twitter.com", clicks: 1 },
    ]);
  });

  it("gives anyone without the key the same 404 as a link that doesn't exist", async () => {
    const { app, auth } = await withClicks();
    expect((await app.request("/api/links/tikiti/stats", auth("wrong"))).status).toBe(404);
    expect((await app.request("/api/links/tikiti/stats")).status).toBe(404);
    expect((await app.request("/api/links/tikiti", { method: "DELETE" })).status).toBe(404);
  });

  it("lets the owner delete the link", async () => {
    const { app, token, auth } = await withClicks();
    expect((await app.request("/api/links/tikiti", { method: "DELETE", ...auth(token) })).status).toBe(204);
    expect((await app.request("/tikiti")).status).toBe(404);
  });
});
