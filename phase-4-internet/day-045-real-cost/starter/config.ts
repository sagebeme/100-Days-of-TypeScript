import { z } from "zod";
import { describeIssues } from "./describe-issues.ts";

// Everything the app needs from the environment, checked once at start-up.
// A missing key fails here, with a clear message, instead of as a 401 halfway through.
// TODO: ConfigSchema, a z.object for the environment:
//   RATES_API_KEY: trimmed string, at least 10 characters
//     missing -> "RATES_API_KEY is missing. Copy .env.example to .env and put your key in it."
//     too short -> "RATES_API_KEY looks too short to be a real key"
//   RATES_API_URL: z.url(), default "http://localhost:4545/latest"
//     not a URL -> "RATES_API_URL must be a full URL, like http://localhost:4545/latest"

export interface Config {
  ratesApiKey: string;
  ratesApiUrl: string;
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  // TODO: safeParse env with ConfigSchema. If it fails, throw
  //   "Bad configuration:\n  <problem 1>\n  <problem 2>" (describeIssues, one per line, indented)
  // TODO: return { ratesApiKey, ratesApiUrl }
  throw new Error("not implemented yet");
}

export function redact(secret: string): string {
  // TODO: 8 characters or fewer -> "****"; longer -> "****" plus the last 4 characters
  throw new Error("not implemented yet");
}
