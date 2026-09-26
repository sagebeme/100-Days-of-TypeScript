import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { SYSTEM_PROMPT } from "./prompt.ts";

export const GENRES = ["afrobeats", "benga", "gengetone", "jazz", "comedy", "rhumba", "other"] as const;

// The shape of a draft. The descriptions go to the model with the schema: they're instructions too.
export const EventDraftSchema = z.object({
  title: z.string().min(3).max(80),
  venue: z.string().min(2).max(80).nullable(),
  startsAt: z.iso.datetime({ offset: true }).describe("When it starts, in Nairobi time, like 2026-12-12T18:00:00+03:00"),
  endsAt: z.iso.datetime({ offset: true }).nullable(),
  genre: z.enum(GENRES),
  tiers: z
    .array(z.object({ name: z.string().min(1), priceKes: z.number().int().min(0) }))
    .min(1)
    .describe('Ticket types and prices, like [{"name": "Regular", "priceKes": 1500}]'),
  capacity: z.number().int().positive().nullable(),
  lineUp: z.array(z.object({ name: z.string().min(1), headliner: z.boolean() })),
  ageLimit: z.number().int().min(0).max(25).nullable().describe("Minimum age, like 18, or null if none is given"),
  missing: z.array(z.string()).describe("What an organiser would still need to tell us, as short questions"),
});
export type EventDraft = z.infer<typeof EventDraftSchema>;

export type Extraction =
  | { ok: true; draft: EventDraft; attempts: number }
  | { ok: false; reason: "declined" | "invalid"; problems: string[] };

// "Saturday 5 December 2026", in Nairobi, so "this Saturday" means something.
export function todayInNairobi(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", weekday: "long", day: "numeric", month: "long", year: "numeric" }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("weekday")} ${part("day")} ${part("month")} ${part("year")}`;
}

// Zod's complaints, as lines a person (or a model) can act on: "tiers.0.priceKes: Too small: expected number to be >=0".
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "(the whole reply)"}: ${issue.message}`);
}

function check(text: string): { draft: EventDraft } | { problems: string[] } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { problems: ["The reply wasn't valid JSON"] };
  }
  const result = EventDraftSchema.safeParse(json);
  return result.success ? { draft: result.data } : { problems: describeIssues(result.error) };
}

const MAX_ATTEMPTS = 2;

// Structured output makes the model answer in the schema's SHAPE: the right fields, the right types.
// It doesn't enforce every rule (look at the request: some become hints in a description), so the
// answer is checked with Zod here, and if it fails, the model gets one chance to fix exactly what's wrong.
export async function extractEvent(client: Anthropic, announcement: string, now: Date): Promise<Extraction> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `Today is ${todayInNairobi(now)}.\n\n<announcement>\n${announcement}\n</announcement>` },
  ];
  let problems: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const message = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 16_000,
      system: SYSTEM_PROMPT,
      messages,
      output_config: { format: betaZodOutputFormat(EventDraftSchema), effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });
    if (message.stop_reason === "refusal") return { ok: false, reason: "declined", problems: ["The model declined to read this message"] };

    const text = message.content.flatMap((block) => (block.type === "text" ? [block.text] : [])).join("");
    const checked = check(text);
    if ("draft" in checked) return { ok: true, draft: checked.draft, attempts: attempt };

    problems = checked.problems;
    messages.push(
      { role: "assistant", content: message.content },
      { role: "user", content: `That didn't pass these checks:\n${problems.map((p) => `- ${p}`).join("\n")}\nReply with the corrected JSON.` },
    );
  }
  return { ok: false, reason: "invalid", problems };
}

// The rules a schema can't express: about time, and about the event making sense. A model can be
// confidently wrong about these, so plain code checks them, every time.
export function checkDraft(draft: EventDraft, now: Date): string[] {
  const problems: string[] = [];
  const starts = new Date(draft.startsAt);
  if (starts <= now) problems.push("The start time has already passed");
  if (draft.endsAt && new Date(draft.endsAt) <= starts) problems.push("It ends before it starts");
  const names = draft.tiers.map((t) => t.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) problems.push("Two ticket types have the same name");
  const acts = draft.lineUp.map((a) => a.name.trim().toLowerCase());
  if (new Set(acts).size !== acts.length) problems.push("An act is listed twice");
  if (draft.venue === null) problems.push("Where is it?");
  if (draft.capacity === null) problems.push("How many people can the venue hold?");
  return problems;
}

// What the Day 66 API's POST /events wants. Only for a draft with no problems: the cheapest ticket is
// the listed price.
export function toEventRequest(draft: EventDraft): { title: string; venue: string; startsAt: string; priceKes: number; capacity: number } {
  if (draft.venue === null || draft.capacity === null) throw new Error("The draft still has missing details");
  return {
    title: draft.title,
    venue: draft.venue,
    startsAt: draft.startsAt,
    priceKes: Math.min(...draft.tiers.map((t) => t.priceKes)),
    capacity: draft.capacity,
  };
}
