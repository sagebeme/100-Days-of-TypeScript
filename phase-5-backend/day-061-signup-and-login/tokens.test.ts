import { describe, it, expect, beforeEach, vi } from "vitest";
import { createHmac } from "node:crypto";
import { signJwt, verifyJwt, decodeJwt } from "./starter/jwt.ts";
import { RefreshTokens } from "./starter/refresh-tokens.ts";
import { singleFlight, createAuthClient } from "./starter/client.ts";
import { createTokenApp, REFRESH_COOKIE, type TokenUser } from "./starter/token-app.ts";

const SECRET = "a-long-random-secret-from-an-env-variable";
const t0 = new Date("2026-10-05T09:00:00Z");
const seconds = (date: Date) => Math.floor(date.getTime() / 1000);
const claims = { sub: "1", name: "Amina", role: "fan", iat: seconds(t0), exp: seconds(t0) + 900 };

describe("JWT: sign and verify", () => {
  it("is three base64url parts, and the header says HS256", () => {
    const token = signJwt(claims, SECRET);
    expect(token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]{43}$/);
    expect(JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString())).toEqual({ alg: "HS256", typ: "JWT" });
  });

  it("signs with HMAC-SHA256 over header.payload", () => {
    const [header, payload, signature] = signJwt(claims, SECRET).split(".");
    expect(signature).toBe(createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url"));
  });

  it("is readable by anyone: the payload is encoded, not encrypted", () => {
    expect(decodeJwt(signJwt(claims, SECRET))).toEqual(claims);
    expect(decodeJwt("not a token")).toBeNull();
  });

  it("verifies its own tokens", () => {
    expect(verifyJwt(signJwt(claims, SECRET), SECRET, t0)).toEqual({ ok: true, claims });
  });

  it("rejects a token signed with another secret", () => {
    expect(verifyJwt(signJwt(claims, "someone-elses-secret"), SECRET, t0)).toEqual({ ok: false, reason: "bad-signature" });
  });

  it("rejects a token whose payload was edited, even though the signature is real", () => {
    const [header, , signature] = signJwt(claims, SECRET).split(".");
    const promoted = Buffer.from(JSON.stringify({ ...claims, role: "organiser" })).toString("base64url");
    expect(verifyJwt(`${header}.${promoted}.${signature}`, SECRET, t0)).toEqual({ ok: false, reason: "bad-signature" });
  });

  it('refuses alg "none": the server decides the algorithm, not the token', () => {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ ...claims, role: "organiser" })).toString("base64url");
    expect(verifyJwt(`${header}.${payload}.`, SECRET, t0)).toEqual({ ok: false, reason: "wrong-algorithm" });
  });

  it("rejects an expired token, from the second it expires", () => {
    const token = signJwt(claims, SECRET);
    expect(verifyJwt(token, SECRET, new Date(t0.getTime() + 899_000)).ok).toBe(true);
    expect(verifyJwt(token, SECRET, new Date(t0.getTime() + 900_000))).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects things that aren't tokens", () => {
    expect(verifyJwt("abc", SECRET, t0)).toEqual({ ok: false, reason: "malformed" });
    expect(verifyJwt("a.b.c", SECRET, t0)).toEqual({ ok: false, reason: "malformed" });
  });
});

describe("refresh tokens: rotation and reuse detection", () => {
  let store: RefreshTokens;
  beforeEach(() => (store = new RefreshTokens()));

  it("issues an unguessable token and stores only its hash", () => {
    const token = store.issue(1, t0);
    expect(token).toMatch(/^[\w-]{43}$/);
    expect(store.storedKeys()).toHaveLength(1);
    expect(store.storedKeys()[0]).toMatch(/^[0-9a-f]{64}$/);
    expect(store.storedKeys()).not.toContain(token);
  });

  it("swaps a token for a new one, and the old one is used up", () => {
    const first = store.issue(1, t0);
    const rotated = store.rotate(first, t0);
    expect(rotated).toEqual({ ok: true, token: expect.stringMatching(/^[\w-]{43}$/), userId: 1 });
    if (!rotated.ok) return;
    expect(rotated.token).not.toBe(first);
    expect(store.rotate(rotated.token, t0).ok).toBe(true);
  });

  it("treats a used-up token coming back as theft: the whole family is revoked", () => {
    const stolenCopy = store.issue(1, t0);
    const rotated = store.rotate(stolenCopy, t0); // the real user refreshes
    expect(store.rotate(stolenCopy, t0)).toEqual({ ok: false, reason: "reused" }); // the thief tries the old one
    if (!rotated.ok) return;
    expect(store.rotate(rotated.token, t0)).toEqual({ ok: false, reason: "revoked" }); // the real user must log in again too
  });

  it("keeps other families (other devices) working", () => {
    const phone = store.issue(1, t0);
    const laptop = store.issue(1, t0);
    store.rotate(phone, t0);
    store.rotate(phone, t0); // phone's family is now revoked
    expect(store.rotate(laptop, t0).ok).toBe(true);
  });

  it("expires after 30 days, and doesn't know made-up tokens", () => {
    const token = store.issue(1, t0);
    expect(store.rotate(token, new Date("2026-11-04T09:00:00Z"))).toEqual({ ok: false, reason: "expired" });
    expect(store.rotate("made-up", t0)).toEqual({ ok: false, reason: "unknown" });
  });

  it("revoke logs that device out for good", () => {
    const token = store.issue(1, t0);
    store.revoke(token);
    expect(store.rotate(token, t0)).toEqual({ ok: false, reason: "revoked" });
  });
});

describe("the client: one refresh at a time", () => {
  it("singleFlight shares one run between everyone who asks at once", async () => {
    const task = vi.fn(async () => "fresh");
    const once = singleFlight(task);
    expect(await Promise.all([once(), once(), once()])).toEqual(["fresh", "fresh", "fresh"]);
    expect(task).toHaveBeenCalledTimes(1);
    await once();
    expect(task).toHaveBeenCalledTimes(2); // finished, so the next call runs it again
  });

  it("singleFlight tries again after a failure", async () => {
    const task = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce("fresh");
    const once = singleFlight(task);
    await expect(once()).rejects.toThrow("offline");
    expect(await once()).toBe("fresh");
  });

  it("refreshes once when several requests get a 401 together, then replays them all", async () => {
    const send = vi.fn(async (_path: string, token: string) => new Response(null, { status: token === "new" ? 200 : 401 }));
    const refresh = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return "new";
    });
    const client = createAuthClient({ send, refresh, accessToken: "old" });
    const statuses = (await Promise.all(["/me", "/tickets", "/events"].map((path) => client.request(path)))).map((r) => r.status);
    expect(statuses).toEqual([200, 200, 200]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(client.accessToken).toBe("new");
  });

  it("doesn't refresh again for a request that started before someone else's refresh finished", async () => {
    let slow401!: () => void;
    const send = vi.fn((path: string, token: string) => {
      if (path === "/slow" && token === "old") return new Promise<Response>((resolve) => (slow401 = () => resolve(new Response(null, { status: 401 }))));
      return Promise.resolve(new Response(null, { status: token === "new" ? 200 : 401 }));
    });
    const refresh = vi.fn(async () => "new");
    const client = createAuthClient({ send, refresh, accessToken: "old" });
    const slow = client.request("/slow");
    expect((await client.request("/fast")).status).toBe(200); // this one refreshed
    slow401(); // the slow request's 401 arrives late, for the old token
    expect((await slow).status).toBe(200);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("replays only once: a second 401 is handed back", async () => {
    const send = vi.fn(async () => new Response(null, { status: 401 }));
    const client = createAuthClient({ send, refresh: async () => "new", accessToken: "old" });
    expect((await client.request("/me")).status).toBe(401);
    expect(send).toHaveBeenCalledTimes(2);
  });
});

describe("the token API", () => {
  const amina: TokenUser = { id: 1, name: "Amina", role: "fan" };
  const baraka: TokenUser = { id: 2, name: "Baraka", role: "organiser" };
  let clock: Date;
  let app: ReturnType<typeof createTokenApp>["app"];

  beforeEach(() => {
    clock = t0;
    ({ app } = createTokenApp({
      secret: SECRET,
      now: () => clock,
      checkLogin: async (email, password) => (password !== "matatu-sunset-42" ? null : email === "amina@example.com" ? amina : email === "baraka@example.com" ? baraka : null),
      findUser: async (id) => [amina, baraka].find((user) => user.id === id) ?? null,
    }));
  });

  const login = (email = "amina@example.com", password = "matatu-sunset-42") =>
    app.request("/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  const cookieFrom = (response: Response) => response.headers.get("Set-Cookie")?.split(";")[0] ?? "";
  const refresh = (cookie: string) => app.request("/auth/refresh", { method: "POST", headers: { Cookie: cookie } });
  const me = (token: string) => app.request("/me", { headers: { Authorization: `Bearer ${token}` } });

  it("logs in: an access token in the body, a refresh token in a locked-down cookie", async () => {
    const response = await login();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ accessToken: expect.any(String), tokenType: "Bearer", expiresIn: 900 });
    expect(decodeJwt(body.accessToken)).toEqual({ sub: "1", name: "Amina", role: "fan", iat: seconds(t0), exp: seconds(t0) + 900 });

    const cookie = response.headers.get("Set-Cookie") ?? "";
    expect(cookie).toMatch(new RegExp(`^${REFRESH_COOKIE}=[\\w-]{43};`));
    for (const part of ["HttpOnly", "Secure", "SameSite=Strict", "Path=/auth"]) expect(cookie).toContain(part);
  });

  it("refuses a wrong password with 401 and no tokens", async () => {
    const response = await login("amina@example.com", "guess");
    expect(response.status).toBe(401);
    expect(response.headers.get("Set-Cookie")).toBeNull();
  });

  it("answers /me from the token alone, with no database lookup", async () => {
    const { accessToken } = await (await login()).json();
    expect(await (await me(accessToken)).json()).toEqual({ user: { id: 1, name: "Amina", role: "fan" } });
  });

  it("says why a request isn't authenticated, in WWW-Authenticate", async () => {
    const missing = await app.request("/me");
    expect(missing.status).toBe(401);
    expect(missing.headers.get("WWW-Authenticate")).toBe("Bearer");

    const { accessToken } = await (await login()).json();
    clock = new Date(t0.getTime() + 15 * 60 * 1000);
    const expired = await me(accessToken);
    expect(expired.status).toBe(401);
    expect(expired.headers.get("WWW-Authenticate")).toBe('Bearer error="invalid_token", error_description="Token expired"');
    expect(await expired.json()).toEqual({ error: "Token expired" });
  });

  it("401 means 'who are you?', 403 means 'I know, and no'", async () => {
    const fan = (await (await login()).json()).accessToken;
    const organiser = (await (await login("baraka@example.com")).json()).accessToken;
    const create = (token: string) => app.request("/events", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    expect((await create(fan)).status).toBe(403);
    expect((await create(organiser)).status).toBe(201);
    expect((await app.request("/events", { method: "POST" })).status).toBe(401);
  });

  it("refreshes: a new access token, and a new refresh cookie each time", async () => {
    const first = cookieFrom(await login());
    clock = new Date(t0.getTime() + 20 * 60 * 1000);
    const response = await refresh(first);
    expect(response.status).toBe(200);
    const { accessToken } = await response.json();
    expect((await me(accessToken)).status).toBe(200);
    expect(cookieFrom(response)).not.toBe(first);
  });

  it("logs everyone out of that family when an old refresh token is replayed", async () => {
    const stolen = cookieFrom(await login());
    const current = cookieFrom(await refresh(stolen));
    const replay = await refresh(stolen);
    expect(replay.status).toBe(401);
    expect(await replay.json()).toEqual({ error: "Log in again" });
    expect(replay.headers.get("Set-Cookie")).toMatch(new RegExp(`^${REFRESH_COOKIE}=;`));
    expect((await refresh(current)).status).toBe(401);
  });

  it("logs out: the refresh token stops working, the cookie is cleared", async () => {
    const cookie = cookieFrom(await login());
    const out = await app.request("/auth/logout", { method: "POST", headers: { Cookie: cookie } });
    expect(out.status).toBe(204);
    expect(out.headers.get("Set-Cookie")).toMatch(new RegExp(`^${REFRESH_COOKIE}=;`));
    expect((await refresh(cookie)).status).toBe(401);
  });

  it("can't take back an access token: it works until it expires, even after logout", async () => {
    const response = await login();
    const { accessToken } = await response.json();
    await app.request("/auth/logout", { method: "POST", headers: { Cookie: cookieFrom(response) } });
    expect((await me(accessToken)).status).toBe(200); // this is why access tokens are short
  });
});
