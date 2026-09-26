import type Anthropic from "@anthropic-ai/sdk";
import { understand } from "./understand.ts";
import type { MultilingualCase } from "./cases.ts";
import type { Grader } from "../../day-079-evals/starter/graders.ts";

// Does the reply come back in the fan's language? The same understanding step that reads fans'
// messages reads the concierge's reply, so one careful piece of work serves both.
export function repliesInLanguage(client: Anthropic): Grader {
  return async (testCase, answer) => {
    const expected = (testCase as Partial<MultilingualCase>).language;
    if (!expected) return null;
    const { language } = await understand(client, answer.text);
    return { grader: "language", pass: language === expected, reason: language === expected ? `Replied in ${expected}` : `Asked in ${expected}, replied in ${language}` };
  };
}
