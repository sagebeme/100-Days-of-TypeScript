import type Anthropic from "@anthropic-ai/sdk";
import { understand } from "./understand.ts";
import type { MultilingualCase } from "./cases.ts";
import type { Grader } from "../../day-079-evals/starter/graders.ts";

// TODO: a Day 79 grader: does the reply come back in the fan's language?
// Cases without a language: null. Otherwise run understand() on the reply's text, and compare languages:
//   { grader: "language", pass, reason: "Replied in sheng" or "Asked in sheng, replied in english" }
// The same understanding step that reads fans' messages reads the concierge's replies.
export function repliesInLanguage(client: Anthropic): Grader {
  void [client, understand, null as unknown as MultilingualCase];
  return async () => null;
}
