import { expect } from "vitest";
import type { TestKit } from "./testkit.ts";

// Each scenario is one story about the API, told through its HTTP interface, the way a real client
// would use it. They're plain async functions, so they can run against the real app AND the broken ones.
export interface Scenario {
  name: string;
  run(kit: TestKit): Promise<void>;
}

export const SCENARIOS: Scenario[] = [
  {
    name: "a stranger can't create an event (401)",
    async run(kit) {
      const reply = await kit.as().post("/events", { title: "Party", venue: "Home", startsAt: "2026-10-10T18:00:00Z" });
      expect(reply.status).toBe(401);
    },
  },
  {
    name: "a fan can't create an event (403)",
    async run(kit) {
      await kit.addUser("Fan", "fan");
      const reply = await kit.as("Fan").post("/events", { title: "Party", venue: "Home", startsAt: "2026-10-10T18:00:00Z" });
      expect(reply.status).toBe(403);
    },
  },
  {
    name: "an organiser creates a draft that nobody else can see",
    async run(kit) {
      await kit.addUser("Oscar", "organiser");
      await kit.addUser("Olive", "organiser");
      await kit.addUser("Fan", "fan");
      const id = await kit.createEvent("Oscar");
      expect((await kit.as("Oscar").get(`/events/${id}`)).body.status).toBe("draft");
      expect((await kit.as().get(`/events/${id}`)).status).toBe(404);
      expect((await kit.as("Fan").get(`/events/${id}`)).status).toBe(404);
      expect((await kit.as("Olive").get(`/events/${id}`)).status).toBe(404);
      expect((await kit.as().get("/events")).body.events).toEqual([]);
    },
  },
  {
    name: "an organiser can't edit another organiser's published event",
    async run(kit) {
      await kit.addUser("Oscar", "organiser");
      await kit.addUser("Olive", "organiser");
      const id = await kit.createEvent("Oscar");
      await kit.as("Oscar").post(`/events/${id}/publish`);
      expect((await kit.as("Olive").patch(`/events/${id}`, { venue: "Olive's place" })).status).toBe(403);
      expect((await kit.as().get(`/events/${id}`)).body.venue).toBe("Alchemist");
    },
  },
  {
    name: "fans who say they're going are counted once each",
    async run(kit) {
      await kit.addUser("Oscar", "organiser");
      await kit.addUser("Fan", "fan");
      const id = await kit.createEvent("Oscar");
      await kit.as("Oscar").post(`/events/${id}/publish`);
      expect((await kit.as("Fan").put(`/events/${id}/going`)).status).toBe(204);
      await kit.as("Fan").put(`/events/${id}/going`);
      expect((await kit.as().get("/events")).body.events[0].going).toBe(1);
    },
  },
  {
    name: "a published event can't be deleted, even by an admin",
    async run(kit) {
      await kit.addUser("Oscar", "organiser");
      await kit.addUser("Ada", "admin");
      const id = await kit.createEvent("Oscar");
      await kit.as("Oscar").post(`/events/${id}/publish`);
      expect((await kit.as("Oscar").delete(`/events/${id}`)).status).toBe(403);
      expect((await kit.as("Ada").delete(`/events/${id}`)).status).toBe(403);
    },
  },
  {
    name: "the last admin can't stop being an admin",
    async run(kit) {
      const ada = await kit.addUser("Ada", "admin");
      expect((await kit.as("Ada").put(`/admin/users/${ada}/role`, { role: "fan" })).status).toBe(409);
      expect((await kit.as("Ada").get("/admin/users")).status).toBe(200);
    },
  },
  {
    name: "sessions stop working after they expire",
    async run(kit) {
      await kit.addUser("Oscar", "organiser");
      await kit.createEvent("Oscar");
      kit.advance(31 * 24 * 60 * 60 * 1000);
      expect((await kit.as("Oscar").post("/events", { title: "Late", venue: "Here", startsAt: "2026-12-10T18:00:00Z" })).status).toBe(401);
    },
  },
];
