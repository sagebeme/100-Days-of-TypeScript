import { expect } from "vitest";
import type { TestKit } from "./testkit.ts";

// Each scenario is one story about the API, told through its HTTP interface, the way a real client
// would use it. They're plain async functions, so they can run against the real app AND the broken ones.
export interface Scenario {
  name: string;
  run(kit: TestKit): Promise<void>;
}

export const SCENARIOS: Scenario[] = [
  // Two examples to copy. Each scenario sets up exactly what it needs, acts, then checks.
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

  // TODO: at least six more. Some behaviours worth a scenario each (read Day 62's README for the rules):
  //   - an organiser's draft is invisible to strangers, fans and other organisers (404), and isn't listed
  //   - an organiser can't edit another organiser's published event (403), and it stays unchanged
  //   - saying "going" twice still counts once
  //   - a published event can't be deleted, even by an admin
  //   - the last admin can't stop being an admin (409)
  //   - sessions stop working once they expire (use kit.advance)
];
