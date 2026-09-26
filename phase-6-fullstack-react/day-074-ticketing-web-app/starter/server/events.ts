import { Hono } from "hono";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { events, type EventRow } from "./schema.ts";
import { can, type Action } from "./policy.ts";
import { requireRole, requireUser, type Env } from "./guards.ts";
import { readBody, idParam, fail } from "./http.ts";
import { seatsTaken } from "./orders.ts";
import type { Db } from "./db.ts";
import type { SessionUser } from "./sessions.ts";

// Already written: creating and publishing events (Day 62), now with a price and a number of seats.
const EventSchema = z.object({
  title: z.string().trim().min(3).max(80),
  venue: z.string().trim().min(2).max(80),
  startsAt: z.iso.datetime({ offset: true }),
  priceKes: z.number().int().min(1).max(250_000),
  capacity: z.number().int().min(1).max(100_000),
});

export async function loadEvent(db: Db, id: number): Promise<EventRow> {
  const event = await db.query.events.findFirst({ where: eq(events.id, id) });
  if (!event) fail(404, "No such event");
  return event;
}

// Turns a "no" from the policy into the right status. Someone who can't even see a draft gets a 404,
// so they can't learn it exists.
export function check(user: SessionUser | null, action: Action, event?: EventRow): void {
  if (event && !can(user, { do: "see-event", event })) fail(404, "No such event");
  if (can(user, action)) return;
  if (!user) fail(401, "Log in first");
  fail(403, "You can't do that");
}

export function eventRoutes(options: { db: Db; now: () => Date }) {
  const { db, now } = options;
  const app = new Hono<Env>();

  const withSeats = async (event: EventRow) => ({ ...event, available: event.capacity - (await seatsTaken(db, event.id, now())) });

  app.get("/events", async (c) => {
    const rows = await db.query.events.findMany({ where: eq(events.status, "published"), orderBy: asc(events.startsAt) });
    return c.json({ events: await Promise.all(rows.map(withSeats)) });
  });

  app.get("/events/:id", async (c) => {
    const event = await loadEvent(db, idParam(c));
    check(c.get("user"), { do: "see-event", event });
    return c.json(await withSeats(event));
  });

  app.post("/events", requireRole("organiser", "admin"), async (c) => {
    const input = await readBody(c, EventSchema);
    const [event] = await db
      .insert(events)
      .values({ ...input, organiserId: c.get("user").id, createdAt: now().toISOString() })
      .returning();
    return c.json(event, 201);
  });

  app.patch("/events/:id", requireUser, async (c) => {
    const event = await loadEvent(db, idParam(c));
    check(c.get("user"), { do: "edit-event", event }, event);
    const changes = await readBody(c, EventSchema.partial().strict());
    const [updated] = await db.update(events).set(changes).where(eq(events.id, event.id)).returning();
    return c.json(updated);
  });

  for (const [path, status] of [["publish", "published"], ["cancel", "cancelled"]] as const) {
    app.post(`/events/:id/${path}`, requireUser, async (c) => {
      const event = await loadEvent(db, idParam(c));
      check(c.get("user"), { do: "edit-event", event }, event);
      const [updated] = await db.update(events).set({ status }).where(eq(events.id, event.id)).returning();
      return c.json(updated);
    });
  }

  return app;
}
