import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { SYSTEM_PROMPT } from "./prompt.ts";

export const GENRES = ["afrobeats", "benga", "gengetone", "jazz", "comedy", "rhumba", "other"] as const;

// TODO: the shape of a draft, in this order (the tests check the order of the fields):
//   title        string, 3 to 80 characters
//   venue        string, 2 to 80 characters, or null
//   startsAt     z.iso.datetime({ offset: true }), with .describe("When it starts, in Nairobi time, like 2026-12-12T18:00:00+03:00")
//   endsAt       the same, or null
//   genre        one of GENRES
//   tiers        at least one { name: non-empty string, priceKes: whole number, 0 or more }
//   capacity     a whole number above 0, or null
//   lineUp       a list of { name: non-empty string, headliner: boolean }
//   ageLimit     a whole number from 0 to 25, or null
//   missing      a list of strings: what an organiser would still need to tell us
// .describe() text is sent to the model with the schema, so descriptions are instructions too.
export const EventDraftSchema = z.object({
  title: z.string(),
});
export type EventDraft = {
  title: string;
  venue: string | null;
  startsAt: string;
  endsAt: string | null;
  genre: (typeof GENRES)[number];
  tiers: { name: string; priceKes: number }[];
  capacity: number | null;
  lineUp: { name: string; headliner: boolean }[];
  ageLimit: number | null;
  missing: string[];
};

export type Extraction =
  | { ok: true; draft: EventDraft; attempts: number }
  | { ok: false; reason: "declined" | "invalid"; problems: string[] };

// Already written: "Saturday 5 December 2026", in Nairobi, so "this Saturday" means something.
export function todayInNairobi(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", weekday: "long", day: "numeric", month: "long", year: "numeric" }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("weekday")} ${part("day")} ${part("month")} ${part("year")}`;
}

// Already written: Zod's complaints as lines a person (or a model) can act on: "tiers.0.priceKes: Too small...".
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "(the whole reply)"}: ${issue.message}`);
}

// TODO: turn an announcement into a checked draft, with at most 2 attempts.
// - The first message: `Today is ${todayInNairobi(now)}.\n\n<announcement>\n${announcement}\n</announcement>`
// - The request: claude-opus-5, max_tokens 16_000, system: SYSTEM_PROMPT, the messages,
//   output_config: { format: betaZodOutputFormat(EventDraftSchema), effort: "low" }, and Day 75's fallbacks.
// - A refusal: { ok: false, reason: "declined", problems: ["The model declined to read this message"] }
// - Otherwise take the text, JSON.parse it (failing: "The reply wasn't valid JSON"), and
//   EventDraftSchema.safeParse it (failing: describeIssues). Passing: { ok: true, draft, attempts }.
// - Failing: add the model's reply, then a user message:
//   "That didn't pass these checks:\n- problem one\n- problem two\nReply with the corrected JSON." and try again.
// - Still failing after 2: { ok: false, reason: "invalid", problems: the last problems }
// Structured output makes the model answer in the schema's shape, but look at the request: some rules
// (lengths, limits, even the genre list) only go as hints. That's why you check it yourself.
export async function extractEvent(client: Anthropic, announcement: string, now: Date): Promise<Extraction> {
  void [client, announcement, now, betaZodOutputFormat, SYSTEM_PROMPT];
  throw new Error("TODO: extractEvent");
}

// TODO: the rules a schema can't express, as problems, in this order:
//   "The start time has already passed", "It ends before it starts", "Two ticket types have the same name"
//   and "An act is listed twice" (both ignoring case and spaces at the ends), "Where is it?" (no venue),
//   "How many people can the venue hold?" (no capacity)
export function checkDraft(draft: EventDraft, now: Date): string[] {
  void [draft, now];
  return [];
}

// TODO: what the Day 66 API's POST /events takes: { title, venue, startsAt, priceKes: the cheapest tier,
// capacity }. Throw "The draft still has missing details" when there's no venue or capacity.
export function toEventRequest(draft: EventDraft): { title: string; venue: string; startsAt: string; priceKes: number; capacity: number } {
  void draft;
  throw new Error("TODO: toEventRequest");
}
