import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { and, asc, count, eq } from "drizzle-orm";
import { z } from "zod";
import { events, going, users, ROLES } from "./schema.ts";
import { can, type Action } from "./policy.ts";
import { currentUser, requireUser, requireRole, type Env } from "./guards.ts";
import type { Db } from "./db.ts";

const EventSchema = z.object({
  title: z.string().trim().min(3).max(80),
  venue: z.string().trim().min(2).max(80),
  startsAt: z.iso.datetime({ offset: true }),
});

async function read<S extends z.ZodType>(request: { json(): Promise<unknown> }, schema: S): Promise<z.output<S>> {
  const result = schema.safeParse(await request.json().catch(() => null));
  if (!result.success) throw new HTTPException(422, { message: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") });
  return result.data;
}

export function createApp(options: { db: Db; now?: () => Date }) {
  const { db } = options;
  const now = options.now ?? (() => new Date());

  async function loadEvent(id: string) {
    const event = await db.query.events.findFirst({ where: eq(events.id, Number(id)) });
    if (!event) throw new HTTPException(404, { message: `No event ${id}` });
    return event;
  }

  function check(user: Parameters<typeof can>[0], action: Action, hideAs404 = false) {
    // TODO: allowed by can() -> return
    // TODO: not allowed and hideAs404 -> 404 "No such event" (don't reveal a draft exists)
    // TODO: not allowed, not logged in -> 401 "Log in first"; logged in -> 403 "You can't do that to this event"
    void can;
    void user;
    void action;
    void hideAs404;
  }

  const app = new Hono<Env>().use(currentUser(db, now));

  // Public: anyone, logged in or not, sees published events.
  app.get("/events", async (c) => {
    const rows = await db
      .select({ id: events.id, title: events.title, venue: events.venue, startsAt: events.startsAt, status: events.status, going: count(going.userId) })
      .from(events)
      .leftJoin(going, eq(going.eventId, events.id))
      .where(eq(events.status, "published"))
      .groupBy(events.id)
      .orderBy(asc(events.startsAt));
    return c.json({ events: rows });
  });

  app.get("/events/:id", async (c) => {
    const event = await loadEvent(c.req.param("id"));
    check(c.get("user"), { do: "see-event", event }, true);
    return c.json(event);
  });

  // Organisers (and admins) only: the guard answers 401 or 403 before the handler runs.
  app.post("/events", requireRole("organiser", "admin"), async (c) => {
    const input = await read(c.req, EventSchema);
    const [event] = await db
      .insert(events)
      .values({ ...input, organiserId: c.get("user").id, createdAt: now().toISOString() })
      .returning();
    return c.json(event, 201);
  });

  // Ownership can't be checked by a role guard: it depends on WHICH event. So the policy decides.
  app.patch("/events/:id", requireUser, async (c) => {
    const event = await loadEvent(c.req.param("id"));
    check(c.get("user"), { do: "see-event", event }, true);
    check(c.get("user"), { do: "edit-event", event });
    const changes = await read(c.req, EventSchema.partial().strict());
    const [updated] = await db.update(events).set(changes).where(eq(events.id, event.id)).returning();
    return c.json(updated);
  });

  app.post("/events/:id/publish", requireUser, async (c) => {
    const event = await loadEvent(c.req.param("id"));
    check(c.get("user"), { do: "see-event", event }, true);
    check(c.get("user"), { do: "publish-event", event });
    const [updated] = await db.update(events).set({ status: "published" }).where(eq(events.id, event.id)).returning();
    return c.json(updated);
  });

  app.delete("/events/:id", requireUser, async (c) => {
    const event = await loadEvent(c.req.param("id"));
    check(c.get("user"), { do: "see-event", event }, true);
    check(c.get("user"), { do: "delete-event", event });
    await db.delete(events).where(eq(events.id, event.id));
    return c.body(null, 204);
  });

  app.put("/events/:id/going", requireUser, async (c) => {
    const event = await loadEvent(c.req.param("id"));
    check(c.get("user"), { do: "see-event", event }, true);
    check(c.get("user"), { do: "mark-going", event });
    await db.insert(going).values({ eventId: event.id, userId: c.get("user").id }).onConflictDoNothing();
    return c.body(null, 204);
  });

  app.delete("/events/:id/going", requireUser, async (c) => {
    const event = await loadEvent(c.req.param("id"));
    await db.delete(going).where(and(eq(going.eventId, event.id), eq(going.userId, c.get("user").id)));
    return c.body(null, 204);
  });

  // Admins only.
  app.get("/admin/users", requireRole("admin"), async (c) =>
    c.json({ users: await db.select({ id: users.id, email: users.email, name: users.name, role: users.role }).from(users).orderBy(asc(users.id)) }),
  );

  app.put("/admin/users/:id/role", requireRole("admin"), async (c) => {
    const { role } = await read(c.req, z.object({ role: z.enum(ROLES) }));
    const id = Number(c.req.param("id"));
    const target = await db.query.users.findFirst({ where: eq(users.id, id) });
    if (!target) throw new HTTPException(404, { message: `No user ${id}` });
    // TODO: demoting an admin when they're the only one left -> 409
    //   "That's the last admin. Make someone else an admin first." (count the admins first)
    void count;
    const [updated] = await db.update(users).set({ role }).where(eq(users.id, id)).returning({ id: users.id, role: users.role });
    return c.json(updated);
  });

  app.onError((error, c) =>
    error instanceof HTTPException ? c.json({ error: error.message }, error.status) : c.json({ error: "Something went wrong on our side" }, 500),
  );
  return app;
}
