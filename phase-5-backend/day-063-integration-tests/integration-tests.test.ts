import { describe, it, expect, afterEach } from "vitest";
import { createKit, type TestKit } from "./starter/testkit.ts";
import { SCENARIOS } from "./starter/scenarios.ts";
import { MUTANTS } from "./starter/mutants.ts";

const kits: TestKit[] = [];
async function kit(overrides = {}): Promise<TestKit> {
  const made = await createKit(overrides);
  kits.push(made);
  return made;
}
afterEach(() => {
  while (kits.length > 0) kits.pop()!.close();
});

describe("your test kit", () => {
  it("gives every test its own empty database", async () => {
    const a = await kit();
    const b = await kit();
    await a.addUser("Oscar", "organiser");
    await a.createEvent("Oscar");
    expect(a.database.sqlite.prepare("SELECT count(*) AS n FROM events").get()).toEqual({ n: 1 });
    expect(b.database.sqlite.prepare("SELECT count(*) AS n FROM events").get()).toEqual({ n: 0 });
  });

  it("logs users in with one line, with the role you ask for", async () => {
    const k = await kit();
    const id = await k.addUser("Ada", "admin");
    expect(id).toBeGreaterThan(0);
    const reply = await k.as("Ada").get("/admin/users");
    expect(reply.status).toBe(200);
    expect(reply.body.users).toEqual([{ id, email: "ada@example.com", name: "Ada", role: "admin" }]);
  });

  it("talks as nobody when you don't give a name", async () => {
    const k = await kit();
    expect((await k.as().get("/admin/users")).status).toBe(401);
  });

  it("refuses to act as a user who doesn't exist", async () => {
    const k = await kit();
    expect(() => k.as("Ghost")).toThrow("No test user called Ghost: call addUser first");
  });

  it("sends JSON bodies and reads JSON back, including empty 204s", async () => {
    const k = await kit();
    await k.addUser("Oscar", "organiser");
    const created = await k.as("Oscar").post("/events", { title: "Bao Night", venue: "Kuona", startsAt: "2026-10-12T17:00:00Z" });
    expect(created).toMatchObject({ status: 201, body: { title: "Bao Night", status: "draft" } });
    const deleted = await k.as("Oscar").delete(`/events/${created.body.id}`);
    expect(deleted).toEqual({ status: 204, body: null });
  });

  it("creates events for a user, with sensible defaults you can override", async () => {
    const k = await kit();
    await k.addUser("Oscar", "organiser");
    const id = await k.createEvent("Oscar", { title: "Custom Title" });
    expect((await k.as("Oscar").get(`/events/${id}`)).body).toMatchObject({ title: "Custom Title", venue: expect.any(String) });
    await k.addUser("Fan", "fan");
    await expect(k.createEvent("Fan")).rejects.toThrow(/createEvent failed with 403/);
  });

  it("controls the clock", async () => {
    const k = await kit();
    const before = k.now().getTime();
    k.advance(60_000);
    expect(k.now().getTime() - before).toBe(60_000);
  });
});

describe("your scenarios", () => {
  it("cover the API properly: at least 8 of them, with clear names", () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(8);
    const names = SCENARIOS.map((s) => s.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name.length).toBeGreaterThan(10);
  });

  it.each(SCENARIOS.map((s) => [s.name, s] as const))("pass against the real app: %s", async (_name, scenario) => {
    await scenario.run(await kit());
  });
});

// Mutation testing: each mutant is the real app with one bug put in on purpose.
// Your scenarios should notice every one of them. A test that can't fail isn't testing anything.
describe("the mutants", () => {
  it.each(MUTANTS.map((m) => [m.name, m] as const))("are caught: %s", async (_name, mutant) => {
    const caughtBy: string[] = [];
    for (const scenario of SCENARIOS) {
      // A scenario only counts if it passes against the REAL app: one that always fails catches nothing.
      try {
        await scenario.run(await kit());
      } catch {
        continue;
      }
      try {
        await scenario.run(await kit(mutant.options));
      } catch {
        caughtBy.push(scenario.name);
      }
    }
    expect(caughtBy, `No working scenario noticed this bug: "${mutant.name}". Write one that would.`).not.toEqual([]);
  });
});
