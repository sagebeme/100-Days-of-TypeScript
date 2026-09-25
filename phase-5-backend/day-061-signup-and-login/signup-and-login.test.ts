import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { openDatabase, type Database } from "./starter/db.ts";
import { migrate, readMigrations } from "./starter/migrate.ts";
import { hashPassword, verifyPassword, passwordProblem } from "./starter/passwords.ts";
import { createSession, findSession, endSession, endAllSessions, hashToken } from "./starter/sessions.ts";
import { createApp, COOKIE } from "./starter/app.ts";

const STRONG = "matatu-sunset-42";

describe("passwords", () => {
  it("stores a salted, slow hash, never the password", async () => {
    const stored = await hashPassword(STRONG);
    expect(stored).toMatch(/^scrypt\$16384\$8\$1\$[\w-]{22}\$[\w-]{43}$/);
    expect(stored).not.toContain(STRONG);
  });

  it("gives the same password a different hash every time", async () => {
    expect(await hashPassword(STRONG)).not.toBe(await hashPassword(STRONG));
  });

  it("checks passwords against the hash", async () => {
    const stored = await hashPassword(STRONG);
    expect(await verifyPassword(STRONG, stored)).toBe(true);
    expect(await verifyPassword("matatu-sunset-43", stored)).toBe(false);
    expect(await verifyPassword(STRONG, "md5$abc")).toBe(false);
    expect(await verifyPassword(STRONG, "")).toBe(false);
  });

  it.each([
    ["short", "Use at least 10 characters"],
    ["password123", "That password is too common"],
    ["amina-rocks-2026", "Don't use your name or email in your password"],
    ["wanjiku.k-is-me", "Don't use your name or email in your password"],
    ["x".repeat(201), "Use at most 200 characters"],
  ])("rejects %j", (password, problem) => {
    expect(passwordProblem(password, { email: "wanjiku.k@example.com", name: "Amina" })).toBe(problem);
  });

  it("accepts a long, personal-free password", () => {
    expect(passwordProblem(STRONG, { email: "wanjiku.k@example.com", name: "Amina" })).toBeNull();
  });
});

describe("sessions", () => {
  let database: Database;
  const t0 = new Date("2026-10-05T09:00:00Z");

  beforeEach(() => {
    database = openDatabase(":memory:");
    migrate(database.sqlite, readMigrations(join(import.meta.dirname, "starter", "migrations")));
    database.sqlite.exec("INSERT INTO users (email, name, password_hash, created_at) VALUES ('amina@example.com', 'Amina', 'x', 'now')");
  });

  afterEach(() => database.close());

  it("makes an unguessable token and stores only its hash", async () => {
    const { token, expiresAt } = await createSession(database.db, 1, t0);
    expect(token).toMatch(/^[\w-]{43}$/);
    expect(expiresAt.toISOString()).toBe("2026-11-04T09:00:00.000Z");
    const rows = database.sqlite.prepare("SELECT id FROM sessions").all() as { id: string }[];
    expect(rows).toEqual([{ id: hashToken(token) }]);
    expect(JSON.stringify(rows)).not.toContain(token);
  });

  it("finds the user a token belongs to, until it expires", async () => {
    const { token } = await createSession(database.db, 1, t0);
    expect(await findSession(database.db, token, t0)).toEqual({ id: 1, email: "amina@example.com", name: "Amina" });
    expect(await findSession(database.db, "made-up-token", t0)).toBeNull();
    const later = new Date(t0.getTime() + 31 * 24 * 60 * 60 * 1000);
    expect(await findSession(database.db, token, later)).toBeNull();
    expect(database.sqlite.prepare("SELECT count(*) AS n FROM sessions").get()).toEqual({ n: 0 });
  });

  it("ends one session, or all of them", async () => {
    const a = await createSession(database.db, 1, t0);
    const b = await createSession(database.db, 1, t0);
    await endSession(database.db, a.token);
    expect(await findSession(database.db, a.token, t0)).toBeNull();
    expect(await findSession(database.db, b.token, t0)).not.toBeNull();
    await endAllSessions(database.db, 1);
    expect(await findSession(database.db, b.token, t0)).toBeNull();
  });
});

describe("the auth API", () => {
  let database: Database;
  let app: ReturnType<typeof createApp>;
  let clock: Date;

  beforeEach(() => {
    database = openDatabase(":memory:");
    migrate(database.sqlite, readMigrations(join(import.meta.dirname, "starter", "migrations")));
    clock = new Date("2026-10-05T09:00:00Z");
    app = createApp({ db: database.db, now: () => clock, secureCookies: true });
  });

  afterEach(() => database.close());

  const post = (path: string, body: unknown, cookie?: string) =>
    app.request(path, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie && { Cookie: cookie }) }, body: JSON.stringify(body) });
  const cookieFrom = (response: Response) => response.headers.get("Set-Cookie")?.split(";")[0] ?? "";
  const signUp = () => post("/signup", { email: " Amina@Example.com ", name: "Amina", password: STRONG });

  it("signs you up and logs you straight in, with a safe cookie", async () => {
    const response = await signUp();
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ user: { id: 1, email: "amina@example.com", name: "Amina" } });
    const setCookie = response.headers.get("Set-Cookie") ?? "";
    expect(setCookie).toMatch(new RegExp(`^${COOKIE}=[\\w-]{43};`));
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");
    expect(setCookie).toContain("SameSite=Lax");
    expect(setCookie).toContain("Path=/");

    const me = await app.request("/me", { headers: { Cookie: cookieFrom(response) } });
    expect(await me.json()).toEqual({ user: { id: 1, email: "amina@example.com", name: "Amina" } });
  });

  it("stores a hash, never the password", async () => {
    await signUp();
    const row = database.sqlite.prepare("SELECT password_hash FROM users").get() as { password_hash: string };
    expect(row.password_hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword(STRONG, row.password_hash)).toBe(true);
  });

  it("refuses a weak password or a taken email", async () => {
    expect(await (await post("/signup", { email: "b@example.com", name: "Baraka", password: "password123" })).json()).toEqual({
      error: "That password is too common",
    });
    await signUp();
    const again = await post("/signup", { email: "AMINA@example.com", name: "Amina Two", password: "another-long-pass" });
    expect(again.status).toBe(409);
    expect((await post("/signup", { email: "not-an-email", name: "X", password: STRONG })).status).toBe(422);
  });

  it("logs in with the right password, whatever the email's case", async () => {
    await signUp();
    const response = await post("/login", { email: "AMINA@example.com", password: STRONG });
    expect(response.status).toBe(200);
    expect(cookieFrom(response)).toMatch(new RegExp(`^${COOKIE}=`));
  });

  it("gives the same answer for a wrong password and an unknown email", async () => {
    await signUp();
    const wrong = await post("/login", { email: "amina@example.com", password: "not-my-password" });
    const unknown = await post("/login", { email: "nobody@example.com", password: STRONG });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(await wrong.json()).toEqual(await unknown.json());
    expect(wrong.headers.get("Set-Cookie")).toBeNull();
  });

  it("logs out: the cookie is cleared and the session is gone for good", async () => {
    const cookie = cookieFrom(await signUp());
    const out = await post("/logout", {}, cookie);
    expect(out.status).toBe(204);
    expect(out.headers.get("Set-Cookie")).toMatch(new RegExp(`^${COOKIE}=;`));
    expect((await app.request("/me", { headers: { Cookie: cookie } })).status).toBe(401);
  });

  it("asks you to log in when there's no session, or it expired", async () => {
    expect(await (await app.request("/me")).json()).toEqual({ error: "Log in first" });
    const cookie = cookieFrom(await signUp());
    clock = new Date("2026-12-01T00:00:00Z");
    expect((await app.request("/me", { headers: { Cookie: cookie } })).status).toBe(401);
  });

  it("only marks cookies Secure when asked", async () => {
    const local = createApp({ db: database.db, now: () => clock, secureCookies: false });
    const response = await local.request("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "dev@example.com", name: "Dev", password: STRONG }),
    });
    expect(response.headers.get("Set-Cookie")).not.toContain("Secure");
  });
});
