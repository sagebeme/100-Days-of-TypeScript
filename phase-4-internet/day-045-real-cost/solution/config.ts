import { z } from "zod";
import { describeIssues } from "./describe-issues.ts";

// Everything the app needs from the environment, checked once at start-up.
// A missing key fails here, with a clear message, instead of as a 401 halfway through.
const ConfigSchema = z.object({
  RATES_API_KEY: z
    .string({ error: "RATES_API_KEY is missing. Copy .env.example to .env and put your key in it." })
    .trim()
    .min(10, "RATES_API_KEY looks too short to be a real key"),
  RATES_API_URL: z.url({ error: "RATES_API_URL must be a full URL, like http://localhost:4545/latest" }).default(
    "http://localhost:4545/latest",
  ),
});

export interface Config {
  ratesApiKey: string;
  ratesApiUrl: string;
}

export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = ConfigSchema.safeParse(env);
  if (!result.success) {
    throw new Error(`Bad configuration:\n  ${describeIssues(result.error).join("\n  ")}`);
  }
  return { ratesApiKey: result.data.RATES_API_KEY, ratesApiUrl: result.data.RATES_API_URL };
}

// Safe to print: enough to tell two keys apart, never enough to use one.
export function redact(secret: string): string {
  return secret.length <= 8 ? "****" : `${"*".repeat(4)}${secret.slice(-4)}`;
}
