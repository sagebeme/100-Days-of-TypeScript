import { describe, it, expect } from "vitest";
import { fakeClaude, say, refuse } from "./starter/fake-claude.ts";
import { EventDraftSchema, extractEvent, checkDraft, toEventRequest, todayInNairobi, describeIssues, type EventDraft } from "./starter/event-draft.ts";
import { SYSTEM_PROMPT } from "./starter/prompt.ts";

const NOW = new Date("2026-12-01T09:00:00Z"); // Tuesday 1 December 2026, noon in Nairobi
const ANNOUNCEMENT = `🔥 GENGETONE BLOCK PARTY 🔥 jumamosi hii!! Kasarani Annex from 3pm till late.
Mtaa Sound x Odi Rider + Kaka Bass, DJ Shiko on the decks. Regular 800, VIP 2k. 18+ only`;

const draft: EventDraft = {
  title: "Gengetone Block Party",
  venue: "Kasarani Annex",
  startsAt: "2026-12-05T15:00:00+03:00",
  endsAt: null,
  genre: "gengetone",
  tiers: [
    { name: "Regular", priceKes: 800 },
    { name: "VIP", priceKes: 2000 },
  ],
  capacity: null,
  lineUp: [
    { name: "Mtaa Sound", headliner: true },
    { name: "Odi Rider", headliner: true },
    { name: "Kaka Bass", headliner: false },
    { name: "DJ Shiko", headliner: false },
  ],
  ageLimit: 18,
  missing: ["How many people can the venue hold?", "When does it end?"],
};

describe("the schema", () => {
  it("accepts a good draft, and nulls for what wasn't said", () => {
    expect(EventDraftSchema.parse(draft)).toEqual(draft);
  });

  it("rejects what a bad reply might contain, saying exactly where", () => {
    const result = EventDraftSchema.safeParse({ ...draft, startsAt: "Saturday 3pm", genre: "hip hop", tiers: [{ name: "Regular", priceKes: -800 }], extra: 1 });
    expect(result.success).toBe(false);
    const problems = describeIssues(result.error!);
    expect(problems.some((p) => p.startsWith("startsAt:"))).toBe(true);
    expect(problems.some((p) => p.startsWith("genre:"))).toBe(true);
    expect(problems.some((p) => p.startsWith("tiers.0.priceKes:"))).toBe(true);
    expect(EventDraftSchema.safeParse({ ...draft, tiers: [] }).success).toBe(false); // at least one ticket type
  });
});

describe("extractEvent", () => {
  it("asks for the schema's shape, with today's date to work out 'this Saturday'", async () => {
    const { client, requests } = fakeClaude([say(JSON.stringify(draft))]);
    const result = await extractEvent(client, ANNOUNCEMENT, NOW);
    expect(result).toEqual({ ok: true, draft, attempts: 1 });

    const body = requests[0].body as Record<string, any>;
    expect(body).toMatchObject({ model: "claude-opus-5", system: SYSTEM_PROMPT, fallbacks: "default" });
    expect(body.output_config.format.type).toBe("json_schema");
    const schema = body.output_config.format.schema;
    expect(Object.keys(schema.properties)).toEqual(["title", "venue", "startsAt", "endsAt", "genre", "tiers", "capacity", "lineUp", "ageLimit", "missing"]);
    expect(schema.additionalProperties).toBe(false);
    const content = body.messages[0].content as string;
    expect(content).toContain("Today is Tuesday 1 December 2026.");
    expect(content).toContain(ANNOUNCEMENT);
  });

  it("gives the model one chance to fix exactly what failed", async () => {
    const bad = JSON.stringify({ ...draft, genre: "hip hop" });
    const { client, requests } = fakeClaude([say(bad), say(JSON.stringify(draft))]);
    const result = await extractEvent(client, ANNOUNCEMENT, NOW);
    expect(result).toMatchObject({ ok: true, attempts: 2 });
    const retry = requests[1].body.messages;
    expect(retry).toHaveLength(3);
    expect(retry[1]).toEqual({ role: "assistant", content: [{ type: "text", text: bad }] });
    expect(retry[2].content).toMatch(/^That didn't pass these checks:\n- genre: .+\nReply with the corrected JSON\.$/s);
  });

  it("gives up after the second try, and says why", async () => {
    const { client, requests } = fakeClaude([say("Sorry, here you go: {"), say("{ still not json")]);
    expect(await extractEvent(client, ANNOUNCEMENT, NOW)).toEqual({ ok: false, reason: "invalid", problems: ["The reply wasn't valid JSON"] });
    expect(requests).toHaveLength(2);
  });

  it("stops at a declined request", async () => {
    const { client, requests } = fakeClaude([refuse()]);
    expect(await extractEvent(client, "…", NOW)).toMatchObject({ ok: false, reason: "declined" });
    expect(requests).toHaveLength(1);
  });

  it("writes today's date in Nairobi, whatever the computer's time zone", () => {
    expect(todayInNairobi(new Date("2026-12-04T22:30:00Z"))).toBe("Saturday 5 December 2026"); // already Saturday in Nairobi
  });
});

describe("checkDraft", () => {
  it("finds what plain code must check, however confident the model was", () => {
    expect(checkDraft({ ...draft, capacity: 1200 }, NOW)).toEqual([]);
    expect(checkDraft(draft, NOW)).toEqual(["How many people can the venue hold?"]);
    expect(
      checkDraft(
        {
          ...draft,
          venue: null,
          capacity: 1200,
          startsAt: "2026-11-28T15:00:00+03:00",
          endsAt: "2026-11-28T14:00:00+03:00",
          tiers: [
            { name: "VIP", priceKes: 2000 },
            { name: "vip ", priceKes: 2500 },
          ],
          lineUp: [
            { name: "DJ Shiko", headliner: true },
            { name: "dj shiko", headliner: false },
          ],
        },
        NOW,
      ),
    ).toEqual(["The start time has already passed", "It ends before it starts", "Two ticket types have the same name", "An act is listed twice", "Where is it?"]);
  });
});

describe("toEventRequest", () => {
  it("turns a finished draft into what the ticketing API takes, listing the cheapest ticket", () => {
    expect(toEventRequest({ ...draft, capacity: 1200 })).toEqual({
      title: "Gengetone Block Party",
      venue: "Kasarani Annex",
      startsAt: "2026-12-05T15:00:00+03:00",
      priceKes: 800,
      capacity: 1200,
    });
    expect(() => toEventRequest(draft)).toThrow(/missing/);
  });
});
