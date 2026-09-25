import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { openDatabase, type Database } from "./starter/db.ts";
import { migrate, readMigrations } from "./starter/migrate.ts";
import { createSession } from "./starter/sessions.ts";
import { can, type Actor, type EventRef } from "./starter/policy.ts";
import { createApp } from "./starter/app.ts";
import { COOKIE } from "./starter/guards.ts";
import type { Role } from "./starter/schema.ts";

describe("the policy", () => {
  const fan: Actor = { id: 1, role: "fan" };
  const organiser: Actor = { id: 2, role: "organiser" };
  const otherOrganiser: Actor = { id: 3, role: "organiser" };
  const admin: Actor = { id: 4, role: "admin" };
  const draft: EventRef = { organiserId: 2, status: "draft" };
  const live: EventRef = { organiserId: 2, status: "published" };
  const cancelled: EventRef = { organiserId: 2, status: "cancelled" };

  it("shows drafts only to their organiser and admins", () => {
    expect(can(null, { do: "see-event", event: live })).toBe(true);
    expect(can(null, { do: "see-event", event: draft })).toBe(false);
    expect(can(fan, { do: "see-event", event: draft })).toBe(false);
    expect(can(otherOrganiser, { do: "see-event", event: draft })).toBe(false);
    expect(can(organiser, { do: "see-event", event: draft })).toBe(true);
    expect(can(admin, { do: "see-event", event: draft })).toBe(true);
    expect(can(null, { do: "see-event", event: cancelled })).toBe(true);
  });

  it("lets organisers and admins create events", () => {
    expect([null, fan, organiser, admin].map((a) => can(a, { do: "create-event" }))).toEqual([false, false, true, true]);
  });

  it("lets organisers edit only their own events, and nobody edit a cancelled one", () => {
    expect(can(organiser, { do: "edit-event", event: live })).toBe(true);
    expect(can(otherOrganiser, { do: "edit-event", event: live })).toBe(false);
    expect(can(admin, { do: "edit-event", event: live })).toBe(true);
    expect(can(organiser, { do: "edit-event", event: cancelled })).toBe(false);
    expect(can(admin, { do: "publish-event", event: cancelled })).toBe(false);
  });

  it("only deletes drafts: published events are cancelled, not deleted", () => {
    expect(can(organiser, { do: "delete-event", event: draft })).toBe(true);
    expect(can(organiser, { do: "delete-event", event: live })).toBe(false);
    expect(can(admin, { do: "delete-event", event: live })).toBe(false);
  });

  it("lets anyone logged in go to a published event", () => {
    expect(can(fan, { do: "mark-going", event: live })).toBe(true);
    expect(can(null, { do: "mark-going", event: live })).toBe(false);
    expect(can(fan, { do: "mark-going", event: draft })).toBe(false);
  });

  it("keeps user management for admins", () => {
    expect([fan, organiser, admin].map((a) => can(a, { do: "manage-users" }))).toEqual([false, false, true]);
  });
});

describe("the events API", () => {
  let database: Database;
  let app: ReturnType<typeof createApp>;
  const who: Record<string, string> = {};
  const now = new Date("2026-10-05T09:00:00Z");

  async function addUser(name: string, role: Role): Promise<void> {
    database.sqlite
      .prepare("INSERT INTO users (email, name, password_hash, created_at, role) VALUES (?, ?, 'x', ?, ?)")
      .run(`${name.toLowerCase()}@example.com`, name, now.toISOString(), role);
    const { id } = database.sqlite.prepare("SELECT id FROM users WHERE name = ?").get(name) as { id: number };
    const { token } = await createSession(database.db, id, now);
    who[name] = `${COOKIE}=${token}`;
  }

  beforeEach(async () => {
    database = openDatabase(":memory:");
    migrate(database.sqlite, readMigrations(join(import.meta.dirname, "starter", "migrations")));
    app = createApp({ db: database.db, now: () => now });
    await addUser("Fan", "fan");
    await addUser("Oscar", "organiser");
    await addUser("Olive", "organiser");
    await addUser("Ada", "admin");
  });

  afterEach(() => database.close());

  const call = async (method: string, path: string, as?: string, body?: unknown) => {
    const response = await app.request(path, {
      method,
      headers: { ...(as && { Cookie: who[as] }), ...(body !== undefined && { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: response.status === 204 ? null : await response.json() };
  };
  const event = { title: "Gengetone Night", venue: "Alchemist", startsAt: "2026-10-10T18:00:00Z" };
  const createAs = async (as: string) => (await call("POST", "/events", as, event)).body.id as number;

  it("answers 401 to strangers and 403 to fans who try to create an event", async () => {
    expect(await call("POST", "/events", undefined, event)).toEqual({ status: 401, body: { error: "Log in first" } });
    expect(await call("POST", "/events", "Fan", event)).toEqual({ status: 403, body: { error: "Only organiser or admin accounts can do that" } });
    const created = await call("POST", "/events", "Oscar", event);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...event, status: "draft" });
  });

  it("keeps drafts secret: a 404, not a 403, so nobody learns they exist", async () => {
    const id = await createAs("Oscar");
    expect((await call("GET", `/events/${id}`, "Oscar")).status).toBe(200);
    expect((await call("GET", `/events/${id}`)).status).toBe(404);
    expect((await call("GET", `/events/${id}`, "Olive")).status).toBe(404);
    expect((await call("PATCH", `/events/${id}`, "Olive", { venue: "Elsewhere" })).status).toBe(404);
    expect((await call("GET", `/events/${id}`, "Ada")).status).toBe(200);
  });

  it("lets organisers change only their own published events (403 for someone else's)", async () => {
    const id = await createAs("Oscar");
    await call("POST", `/events/${id}/publish`, "Oscar");
    expect((await call("PATCH", `/events/${id}`, "Olive", { venue: "Elsewhere" })).status).toBe(403);
    expect((await call("PATCH", `/events/${id}`, "Fan", { venue: "Elsewhere" })).status).toBe(403);
    expect((await call("PATCH", `/events/${id}`, "Oscar", { venue: "The Alchemist Bar" })).body.venue).toBe("The Alchemist Bar");
    expect((await call("PATCH", `/events/${id}`, "Ada", { title: "Gengetone Night II" })).body.title).toBe("Gengetone Night II");
  });

  it("lists only published events, with how many are going", async () => {
    const id = await createAs("Oscar");
    await createAs("Olive"); // stays a draft
    expect((await call("GET", "/events")).body.events).toEqual([]);
    await call("POST", `/events/${id}/publish`, "Oscar");
    expect((await call("PUT", `/events/${id}/going`, "Fan")).status).toBe(204);
    expect((await call("PUT", `/events/${id}/going`, "Fan")).status).toBe(204); // twice is still once
    await call("PUT", `/events/${id}/going`, "Olive");
    expect((await call("GET", "/events")).body.events).toEqual([{ id, ...event, status: "published", going: 2 }]);
    await call("DELETE", `/events/${id}/going`, "Fan");
    expect((await call("GET", "/events")).body.events[0].going).toBe(1);
  });

  it("needs a login to say you're going", async () => {
    const id = await createAs("Oscar");
    await call("POST", `/events/${id}/publish`, "Oscar");
    expect((await call("PUT", `/events/${id}/going`)).status).toBe(401);
  });

  it("deletes drafts, but won't delete a published event", async () => {
    const draft = await createAs("Oscar");
    const live = await createAs("Oscar");
    await call("POST", `/events/${live}/publish`, "Oscar");
    expect((await call("DELETE", `/events/${draft}`, "Oscar")).status).toBe(204);
    expect((await call("DELETE", `/events/${live}`, "Oscar")).status).toBe(403);
    expect((await call("DELETE", `/events/${live}`, "Ada")).status).toBe(403);
  });

  it("lets admins manage roles, and never removes the last admin", async () => {
    expect((await call("GET", "/admin/users", "Oscar")).status).toBe(403);
    const list = await call("GET", "/admin/users", "Ada");
    expect(list.body.users.map((u: { name: string; role: string }) => `${u.name}:${u.role}`)).toEqual(["Fan:fan", "Oscar:organiser", "Olive:organiser", "Ada:admin"]);

    expect((await call("PUT", "/admin/users/1/role", "Ada", { role: "organiser" })).body).toEqual({ id: 1, role: "organiser" });
    expect((await call("POST", "/events", "Fan", event)).status).toBe(201); // the new role works at once

    expect(await call("PUT", "/admin/users/4/role", "Ada", { role: "fan" })).toEqual({
      status: 409,
      body: { error: "That's the last admin. Make someone else an admin first." },
    });
    await call("PUT", "/admin/users/2/role", "Ada", { role: "admin" });
    expect((await call("PUT", "/admin/users/4/role", "Ada", { role: "fan" })).status).toBe(200);
    expect((await call("PUT", "/admin/users/9/role", "Oscar", { role: "fan" })).status).toBe(404);
  });

  it("rejects bad input", async () => {
    expect((await call("POST", "/events", "Oscar", { ...event, startsAt: "next Friday" })).status).toBe(422);
    expect((await call("PUT", "/admin/users/1/role", "Ada", { role: "superuser" })).status).toBe(422);
  });
});
