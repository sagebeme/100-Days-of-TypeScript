// The server side, in Node: real Requests and Responses, with real cookies. (The browser components are
// tested in ticketing-web-app-ui.test.tsx.)
import { describe, it, expect, beforeEach, vi } from "vitest";

// Next's request helpers only work inside a real request, so the tests stand in for them.
const jar = vi.hoisted(() => ({ session: undefined as string | undefined }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => (name === "session" && jar.session ? { name, value: jar.session } : undefined) }) }));

import { getServer, resetServer } from "./starter/server/context.ts";
import { getViewer } from "./starter/server/viewer.ts";
import { listOnSale, findEvent, findOrder, myTickets } from "./starter/server/queries.ts";
import * as route from "./starter/app/api/[[...route]]/route.ts";
import { SEED_ACCOUNTS } from "./starter/server/seed.ts";

// --- helpers: talk to the app exactly as a browser would, through the route handler ---
type Method = "GET" | "POST" | "PATCH" | "DELETE";
async function call(method: Method, path: string, options: { body?: unknown; cookie?: string } = {}) {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.cookie) headers.Cookie = options.cookie;
  const handler = route[method] as (request: Request) => Promise<Response>;
  return handler(new Request(`http://localhost${path}`, { method, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body) }));
}

async function logIn(account: { email: string; password: string }): Promise<string> {
  const response = await call("POST", "/api/login", { body: { email: account.email, password: account.password } });
  expect(response.status).toBe(200);
  return response.headers.get("set-cookie")!.split(";")[0]; // "session=..."
}

async function buyAndPay(cookie: string, quantity = 2) {
  const placed = await call("POST", "/api/events/2/orders", { cookie, body: { quantity, phone: "0712 345 678" } });
  const { order } = await placed.json();
  await call("POST", `/api/dev/orders/${order.id}/settle`, { cookie, body: { outcome: "paid" } });
  return order.id as number;
}

beforeEach(async () => {
  await resetServer();
  jar.session = undefined;
});

describe("the server", () => {
  it("is one instance, migrated and seeded, until it's reset", async () => {
    const first = await getServer();
    expect(await getServer()).toBe(first);
    expect(first.database.sqlite.prepare("SELECT count(*) AS n FROM users").get()).toEqual({ n: 2 });
    expect(first.database.sqlite.prepare("SELECT count(*) AS n FROM events WHERE status = 'published'").get()).toEqual({ n: 4 });
    await resetServer();
    expect(await getServer()).not.toBe(first);
  });

  it("answers Day 66's API under /api, through the Next.js route handler", async () => {
    const response = await call("GET", "/api/events");
    expect(response.status).toBe(200);
    const { events } = await response.json();
    expect(events.map((e: { title: string }) => e.title)).toEqual(["Gengetone Block Party", "Benga Sundowner", "Jioni Jazz Night", "Afrobeats in the Park"]);
    expect((await call("GET", "/api/me")).status).toBe(401);
    expect(route.dynamic).toBe("force-dynamic");
  });

  it("runs the whole story: buy, pay, and get in once", async () => {
    const fan = await logIn(SEED_ACCOUNTS.fan);
    const orderId = await buyAndPay(fan);
    const { order } = await (await call("GET", `/api/orders/${orderId}`, { cookie: fan })).json();
    expect(order).toMatchObject({ status: "paid", quantity: 2, amountKes: 1600 });

    const organiser = await logIn(SEED_ACCOUNTS.organiser);
    const scan = () => call("POST", "/api/events/2/check-in", { cookie: organiser, body: { code: order.tickets[0].code } });
    expect((await scan()).status).toBe(200);
    expect((await scan()).status).toBe(409);
  });
});

describe("pages' data, read on the server", () => {
  it("knows who's looking, from the session cookie", async () => {
    expect(await getViewer()).toBeNull();
    jar.session = (await logIn(SEED_ACCOUNTS.fan)).split("=")[1];
    expect(await getViewer()).toMatchObject({ email: "fan@tikiti.example", name: "Amina Otieno", role: "fan" });
    jar.session = "made-up-token";
    expect(await getViewer()).toBeNull();
  });

  it("lists events on sale by date, with the seats left", async () => {
    const fan = await logIn(SEED_ACCOUNTS.fan);
    await call("POST", "/api/events/2/orders", { cookie: fan, body: { quantity: 3, phone: "0712345678" } }); // held
    const events = await listOnSale();
    expect(events.map((e) => [e.title, e.available])).toEqual([
      ["Gengetone Block Party", 37],
      ["Benga Sundowner", 300],
      ["Jioni Jazz Night", 500],
      ["Afrobeats in the Park", 2000],
    ]);
  });

  it("hides drafts from everyone but their organiser", async () => {
    const organiserCookie = await logIn(SEED_ACCOUNTS.organiser);
    const draft = await (
      await call("POST", "/api/events", { cookie: organiserCookie, body: { title: "Secret Set", venue: "Rooftop", startsAt: "2026-12-31T21:00:00+03:00", priceKes: 5000, capacity: 80 } })
    ).json();
    const { database } = await getServer();
    const users = database.sqlite.prepare("SELECT id, email, name, role FROM users ORDER BY id").all() as { id: number; email: string; name: string; role: "fan" | "organiser" }[];
    expect(await findEvent(draft.id, null)).toBeNull();
    expect(await findEvent(draft.id, users[1])).toBeNull();
    expect(await findEvent(draft.id, users[0])).toMatchObject({ title: "Secret Set", available: 80 });
  });

  it("shows an order, with its ticket codes, only to the fan who placed it", async () => {
    const fan = await logIn(SEED_ACCOUNTS.fan);
    const orderId = await buyAndPay(fan);
    const { database } = await getServer();
    const [organiser, amina] = database.sqlite.prepare("SELECT id, email, name, role FROM users ORDER BY id").all() as { id: number; email: string; name: string; role: "fan" | "organiser" }[];
    const order = await findOrder(orderId, amina);
    expect(order).toMatchObject({ status: "paid", eventTitle: "Gengetone Block Party", amountKes: 1600 });
    expect(order!.tickets.map((t) => t.code)).toEqual([expect.stringMatching(/^T1-[0-9A-F]{16}$/), expect.stringMatching(/^T2-/)]);
    expect(await findOrder(orderId, organiser)).toBeNull();
    expect(await findOrder(orderId, null)).toBeNull();
    expect((await myTickets(amina)).map((t) => [t.event.title, t.code])).toEqual(order!.tickets.map((t) => ["Gengetone Block Party", t.code]));
    expect(await myTickets(organiser)).toEqual([]);
  });
});

