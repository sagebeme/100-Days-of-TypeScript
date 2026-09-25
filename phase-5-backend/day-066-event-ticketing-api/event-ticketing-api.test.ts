import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { openDatabase } from "./starter/db.ts";
import { migrate, readMigrations } from "./starter/migrate.ts";
import { createApp } from "./starter/app.ts";
import { demoPayments, type Payments } from "./starter/payments.ts";
import { ticketCode, readTicketCode } from "./starter/tickets.ts";
import { can, type EventRef } from "./starter/policy.ts";
import { mpesaCallback } from "./starter/simulate-callback.ts";

const SECRET = "test-ticket-secret-0123456789abcdef";
const TOKEN = "test-callback-token";

describe("ticket codes", () => {
  it("are the ticket id plus a signature, and read back to the id", () => {
    const code = ticketCode(42, SECRET);
    expect(code).toMatch(/^T42-[0-9A-F]{16}$/);
    expect(readTicketCode(code, SECRET)).toBe(42);
    expect(ticketCode(42, SECRET)).toBe(code); // the same every time: nothing to store
  });

  it("forgive what people type at the gate", () => {
    const code = ticketCode(7, SECRET);
    expect(readTicketCode(` ${code.toLowerCase().replace("-", " - ")} `, SECRET)).toBe(7);
  });

  it("can't be forged by changing the number, the signature or the secret", () => {
    const code = ticketCode(42, SECRET);
    const signature = code.split("-")[1];
    expect(readTicketCode(`T43-${signature}`, SECRET)).toBeNull();
    expect(readTicketCode(`T42-${signature.slice(0, -1)}${signature.endsWith("0") ? "1" : "0"}`, SECRET)).toBeNull();
    expect(readTicketCode(`T42-${signature.slice(0, 8)}`, SECRET)).toBeNull();
    expect(readTicketCode(ticketCode(42, "someone-elses-secret"), SECRET)).toBeNull();
    for (const junk of ["", "T42", "42-ABCDEF", "T-1-ABC", "<script>", "T42-XYZ"]) expect(readTicketCode(junk, SECRET)).toBeNull();
  });
});

describe("the policy", () => {
  const organiser = { id: 1, role: "organiser" as const };
  const other = { id: 2, role: "organiser" as const };
  const fan = { id: 3, role: "fan" as const };
  const admin = { id: 4, role: "admin" as const };
  const now = new Date("2026-12-01T09:00:00Z");
  const event = (status: EventRef["status"], startsAt = "2026-12-12T18:00:00+03:00"): EventRef => ({ organiserId: 1, status, startsAt });

  it("sells tickets to anyone logged in, for a published event that hasn't started", () => {
    expect(can(fan, { do: "buy-tickets", event: event("published"), now })).toBe(true);
    expect(can(null, { do: "buy-tickets", event: event("published"), now })).toBe(false);
    expect(can(fan, { do: "buy-tickets", event: event("draft"), now })).toBe(false);
    expect(can(fan, { do: "buy-tickets", event: event("cancelled"), now })).toBe(false);
    expect(can(fan, { do: "buy-tickets", event: event("published", "2026-11-30T18:00:00Z"), now })).toBe(false);
  });

  it("lets only the event's own organiser, or an admin, check people in and see sales", () => {
    for (const action of ["check-in", "see-sales"] as const) {
      expect([organiser, other, fan, admin, null].map((actor) => can(actor, { do: action, event: event("published") }))).toEqual([true, false, false, true, false]);
    }
    expect(can(organiser, { do: "check-in", event: event("cancelled") })).toBe(false);
    expect(can(organiser, { do: "see-sales", event: event("cancelled") })).toBe(true);
  });

  it("shows an order to the fan who placed it, and to admins", () => {
    expect([fan, other, admin, null].map((actor) => can(actor, { do: "see-order", order: { userId: 3 } }))).toEqual([true, false, true, false]);
  });
});

// --- The whole API, with a real (in-memory) database and a fake M-Pesa ---

async function setup(options: { payments?: Payments; capacity?: number; priceKes?: number } = {}) {
  const database = openDatabase(":memory:");
  migrate(database.sqlite, readMigrations(join(import.meta.dirname, "starter/migrations")));
  const demo = demoPayments();
  let clock = new Date("2026-12-01T09:00:00Z");
  const app = createApp({ database, payments: options.payments ?? demo, ticketSecret: SECRET, callbackToken: TOKEN, now: () => clock, secureCookies: false });

  // A browser: remembers its cookie between requests.
  async function person(name: string, role: "fan" | "organiser" | "admin" = "fan") {
    const email = `${name.toLowerCase()}@example.com`;
    const response = await app.request("/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password: "long-enough-passphrase-9" }),
    });
    const cookie = response.headers.get("set-cookie")!.split(";")[0];
    const { user } = await response.json();
    if (role !== "fan") database.sqlite.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, user.id);
    const call = (method: string, path: string, body?: unknown) =>
      app.request(path, { method, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { id: user.id as number, call, json: async (method: string, path: string, body?: unknown) => (await call(method, path, body)).json() };
  }

  const organiser = await person("Wanjiru", "organiser");
  const created = await organiser.json("POST", "/events", {
    title: "Jioni Jazz Night",
    venue: "Uhuru Gardens",
    startsAt: "2026-12-12T18:00:00+03:00",
    priceKes: options.priceKes ?? 1000,
    capacity: options.capacity ?? 5,
  });
  await organiser.call("POST", `/events/${created.id}/publish`);
  const eventId: number = created.id;

  const pay = (checkoutRequestId: string, amount: number, outcome: "paid" | "cancelled" | "failed" = "paid", token = TOKEN) =>
    app.request(`/payments/mpesa/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(mpesaCallback(checkoutRequestId, amount, outcome)) });
  const available = async () => (await (await app.request(`/events/${eventId}`)).json()).available as number;
  const later = (minutes: number) => void (clock = new Date(clock.getTime() + minutes * 60_000));

  return { app, database, demo, person, organiser, eventId, pay, available, later };
}

describe("buying tickets", () => {
  it("holds the seats, prompts the phone, and issues tickets when M-Pesa says it's paid", async () => {
    const { person, demo, eventId, pay, available, organiser } = await setup();
    const amina = await person("Amina");

    const response = await amina.call("POST", `/events/${eventId}/orders`, { quantity: 2, phone: "0712 345 678" });
    expect(response.status).toBe(201);
    const { order, message } = await response.json();
    expect(message).toMatch(/phone/i);
    expect(order).toMatchObject({ quantity: 2, amountKes: 2000, status: "pending", tickets: [] });
    expect(demo.started).toEqual([{ phone: "254712345678", amount: 2000, reference: `ORDER-${order.id}`, description: "Event tickets" }]);
    expect(await available()).toBe(3); // held while she pays

    expect(await (await pay("ws_CO_DEMO_1", 2000)).json()).toMatchObject({ ResultCode: 0, result: "paid" });
    const paid = (await amina.json("GET", `/orders/${order.id}`)).order;
    expect(paid).toMatchObject({ status: "paid", receipt: expect.stringMatching(/^TK/) });
    expect(paid.tickets).toHaveLength(2);
    for (const ticket of paid.tickets) expect(ticket.code).toMatch(/^T\d+-[0-9A-F]{16}$/);
    expect(await available()).toBe(3);
    expect(await organiser.json("GET", `/events/${eventId}/sales`)).toEqual({ capacity: 5, sold: 2, held: 0, available: 3, revenueKes: 2000, checkedIn: 0 });
  });

  it("checks the order before holding anything", async () => {
    const { app, person, organiser, eventId, demo } = await setup();
    const amina = await person("Amina");
    for (const body of [{ quantity: 0, phone: "0712345678" }, { quantity: 11, phone: "0712345678" }, { quantity: 1, phone: "0800 123" }, { quantity: 1.5, phone: "0712345678" }, {}]) {
      expect((await amina.call("POST", `/events/${eventId}/orders`, body)).status).toBe(422);
    }
    expect((await amina.json("POST", `/events/${eventId}/orders`, { quantity: 1, phone: "0800 123" })).error).toMatch(/Safaricom number/);
    expect((await app.request(`/events/${eventId}/orders`, { method: "POST" })).status).toBe(401);

    const draft = await organiser.json("POST", "/events", { title: "Secret Gig", venue: "KICC", startsAt: "2026-12-20T18:00:00+03:00", priceKes: 500, capacity: 10 });
    expect((await amina.call("POST", `/events/${draft.id}/orders`, { quantity: 1, phone: "0712345678" })).status).toBe(404);
    await organiser.call("POST", `/events/${draft.id}/publish`);
    await organiser.call("POST", `/events/${draft.id}/cancel`);
    const cancelled = await amina.call("POST", `/events/${draft.id}/orders`, { quantity: 1, phone: "0712345678" });
    expect([cancelled.status, (await cancelled.json()).error]).toEqual([409, "This event was cancelled"]);
    expect(demo.started).toHaveLength(0);
  });

  it("stops selling once the event has started", async () => {
    const { person, eventId, later } = await setup();
    const amina = await person("Amina");
    later(12 * 24 * 60); // 12 days on: the 12th of December, 18:00 has passed
    expect((await amina.call("POST", `/events/${eventId}/orders`, { quantity: 1, phone: "0712345678" })).status).toBe(409);
  });

  it("never sells more seats than there are, even when orders arrive at the same moment", async () => {
    const { person, eventId, available } = await setup({ capacity: 3 });
    const amina = await person("Amina");
    const baraka = await person("Baraka");
    expect((await amina.call("POST", `/events/${eventId}/orders`, { quantity: 2, phone: "0712345678" })).status).toBe(201);
    const tooMany = await baraka.call("POST", `/events/${eventId}/orders`, { quantity: 2, phone: "0722000000" });
    expect([tooMany.status, (await tooMany.json()).error]).toEqual([409, "Only 1 left"]);

    const rush = await Promise.all(Array.from({ length: 4 }, () => baraka.call("POST", `/events/${eventId}/orders`, { quantity: 1, phone: "0722000000" })));
    expect(rush.map((r) => r.status).sort()).toEqual([201, 409, 409, 409]);
    expect(await available()).toBe(0);
  });

  it("gives held seats back when nobody pays within 10 minutes", async () => {
    const { person, eventId, available, later } = await setup({ capacity: 2 });
    const amina = await person("Amina");
    const { order } = await amina.json("POST", `/events/${eventId}/orders`, { quantity: 2, phone: "0712345678" });
    expect(await available()).toBe(0);
    later(9);
    expect(await available()).toBe(0);
    later(2);
    expect(await available()).toBe(2);
    expect((await amina.json("GET", `/orders/${order.id}`)).order.status).toBe("expired");
  });

  it("gives the seats back when the fan cancels on their phone, or can't pay", async () => {
    const { person, eventId, pay, available } = await setup({ capacity: 2 });
    const amina = await person("Amina");
    const first = (await amina.json("POST", `/events/${eventId}/orders`, { quantity: 2, phone: "0712345678" })).order;
    await pay("ws_CO_DEMO_1", 2000, "cancelled");
    expect((await amina.json("GET", `/orders/${first.id}`)).order).toMatchObject({ status: "cancelled", problem: expect.stringMatching(/cancelled/i), tickets: [] });
    expect(await available()).toBe(2);

    const second = (await amina.json("POST", `/events/${eventId}/orders`, { quantity: 1, phone: "0712345678" })).order;
    await pay("ws_CO_DEMO_2", 1000, "failed");
    expect((await amina.json("GET", `/orders/${second.id}`)).order).toMatchObject({ status: "failed", problem: expect.stringMatching(/balance/i) });
    expect(await available()).toBe(2);
  });

  it("releases the seats and says so when M-Pesa is down", async () => {
    const down: Payments = { start: async () => { throw new Error("ECONNRESET"); } };
    const { person, eventId, available } = await setup({ payments: down, capacity: 2 });
    const amina = await person("Amina");
    const response = await amina.call("POST", `/events/${eventId}/orders`, { quantity: 2, phone: "0712345678" });
    expect(response.status).toBe(502);
    expect((await response.json()).error).toMatch(/no money was taken/);
    expect(await available()).toBe(2);
  });

  it("shows an order only to the fan who placed it, and admins", async () => {
    const { person, eventId } = await setup();
    const amina = await person("Amina");
    const baraka = await person("Baraka");
    const admin = await person("Admin", "admin");
    const { order } = await amina.json("POST", `/events/${eventId}/orders`, { quantity: 1, phone: "0712345678" });
    expect((await baraka.call("GET", `/orders/${order.id}`)).status).toBe(404);
    expect((await baraka.call("GET", "/orders/999")).status).toBe(404);
    expect((await admin.call("GET", `/orders/${order.id}`)).status).toBe(200);
  });
});

describe("the M-Pesa callback", () => {
  it("issues tickets once, however many times Safaricom sends the same result", async () => {
    const { person, eventId, pay, database } = await setup();
    const amina = await person("Amina");
    await amina.json("POST", `/events/${eventId}/orders`, { quantity: 2, phone: "0712345678" });
    const results = [];
    for (let i = 0; i < 3; i++) results.push((await (await pay("ws_CO_DEMO_1", 2000)).json()).result);
    expect(results).toEqual(["paid", "already-settled", "already-settled"]);
    expect(database.sqlite.prepare("SELECT count(*) AS n FROM tickets").get()).toEqual({ n: 2 });
  });

  it("doesn't issue tickets for the wrong amount, and records that a refund is needed", async () => {
    const { person, eventId, pay, organiser } = await setup();
    const amina = await person("Amina");
    const { order } = await amina.json("POST", `/events/${eventId}/orders`, { quantity: 2, phone: "0712345678" });
    expect((await (await pay("ws_CO_DEMO_1", 1)).json()).result).toBe("refund-needed");
    const after = (await amina.json("GET", `/orders/${order.id}`)).order;
    expect(after).toMatchObject({ status: "failed", tickets: [], problem: expect.stringMatching(/KES 1 .*KES 2000.*refund/) });
    expect((await organiser.json("GET", `/events/${eventId}/sales`)).sold).toBe(0);
  });

  it("honours a late payment if the seats are still there, and flags a refund if they're not", async () => {
    const { person, eventId, pay, later } = await setup({ capacity: 2 });
    const amina = await person("Amina");
    const baraka = await person("Baraka");

    const slow = (await amina.json("POST", `/events/${eventId}/orders`, { quantity: 1, phone: "0712345678" })).order;
    later(15);
    expect((await (await pay("ws_CO_DEMO_1", 1000)).json()).result).toBe("paid");
    expect((await amina.json("GET", `/orders/${slow.id}`)).order.tickets).toHaveLength(1);

    const slower = (await amina.json("POST", `/events/${eventId}/orders`, { quantity: 1, phone: "0712345678" })).order;
    later(15);
    await baraka.json("POST", `/events/${eventId}/orders`, { quantity: 1, phone: "0722000000" }); // takes the last seat
    await pay("ws_CO_DEMO_3", 1000);
    expect((await (await pay("ws_CO_DEMO_2", 1000)).json()).result).toBe("refund-needed");
    expect((await amina.json("GET", `/orders/${slower.id}`)).order).toMatchObject({ status: "failed", problem: expect.stringMatching(/refund needed/) });
  });

  it("ignores strangers: a wrong token is a 404, and nothing changes", async () => {
    const { person, eventId, pay, app } = await setup();
    const amina = await person("Amina");
    const { order } = await amina.json("POST", `/events/${eventId}/orders`, { quantity: 1, phone: "0712345678" });
    expect((await pay("ws_CO_DEMO_1", 1000, "paid", "guess")).status).toBe(404);
    expect((await amina.json("GET", `/orders/${order.id}`)).order.status).toBe("pending");
    const junk = await app.request(`/payments/mpesa/${TOKEN}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"hello":1}' });
    expect(junk.status).toBe(400);
    expect((await (await pay("ws_CO_NOBODY", 1000)).json()).result).toBe("unknown-payment");
  });
});

describe("checking in at the gate", () => {
  async function withTickets() {
    const world = await setup();
    const amina = await world.person("Amina");
    const { order } = await amina.json("POST", `/events/${world.eventId}/orders`, { quantity: 2, phone: "0712345678" });
    await world.pay("ws_CO_DEMO_1", 2000);
    const codes: string[] = (await amina.json("GET", `/orders/${order.id}`)).order.tickets.map((t: { code: string }) => t.code);
    const scan = (who: typeof amina, code: string, eventId = world.eventId) => who.call("POST", `/events/${eventId}/check-in`, { code });
    return { ...world, amina, codes, scan };
  }

  it("lets each ticket in once", async () => {
    const { organiser, codes, scan, later } = await withTickets();
    const first = await scan(organiser, codes[0]);
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ admitted: true, holder: "Amina" });

    later(2);
    const again = await scan(organiser, codes[0]);
    expect(again.status).toBe(409);
    expect((await again.json()).error).toBe("Already used: this ticket got in at 12:00.");
    expect((await scan(organiser, codes[1])).status).toBe(200);
  });

  it("lets a ticket in at only one gate when it's scanned at two at once", async () => {
    const { organiser, codes, scan, person, database, eventId } = await withTickets();
    const admin = await person("Admin", "admin");
    const both = await Promise.all([scan(organiser, codes[0]), scan(admin, codes[0])]);
    expect(both.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(database.sqlite.prepare("SELECT count(*) AS n FROM tickets WHERE checked_in_at IS NOT NULL").get()).toEqual({ n: 1 });
    expect((await organiser.json("GET", `/events/${eventId}/sales`)).checkedIn).toBe(1);
  });

  it("turns away forged tickets and tickets for other events", async () => {
    const { organiser, codes, scan } = await withTickets();
    const forged = await scan(organiser, codes[0].replace(/^T(\d+)/, (_, id) => `T${Number(id) + 5}`));
    expect([forged.status, (await forged.json()).error]).toEqual([422, "Not a real ticket. Don't let them in."]);
    expect((await scan(organiser, ticketCode(999, SECRET))).status).toBe(422); // well signed, but no such ticket

    const other = await organiser.json("POST", "/events", { title: "Picnic Sounds", venue: "Nairobi", startsAt: "2026-12-14T14:00:00+03:00", priceKes: 3000, capacity: 100 });
    await organiser.call("POST", `/events/${other.id}/publish`);
    const wrongEvent = await scan(organiser, codes[0], other.id);
    expect([wrongEvent.status, (await wrongEvent.json()).error]).toEqual([409, "This ticket is for a different event."]);
  });

  it("is only for the people running the event", async () => {
    const { amina, person, codes, scan, eventId } = await withTickets();
    const rival = await person("Rival", "organiser");
    expect((await scan(amina, codes[0])).status).toBe(403); // fans can't let themselves in
    expect((await scan(rival, codes[0])).status).toBe(403);
    expect((await amina.call("GET", `/events/${eventId}/sales`)).status).toBe(403);
  });
});
