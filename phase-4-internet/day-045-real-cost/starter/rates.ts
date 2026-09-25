import { z } from "zod";
import type { Config } from "./config.ts";

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

const RatesSchema = z.object({
  base: z.literal("USD"),
  rates: z.record(z.string(), z.number().positive()),
});

export const CACHE_MS = 60 * 60 * 1000; // rates don't change by the second, and free plans have small quotas

export interface RatesClient {
  kesPerDollar(): Promise<number>;
}

export function createRatesClient(config: Config, fetchFn: Fetcher, now: () => number = Date.now): RatesClient {
  // TODO: fetchRate(): fetch config.ratesApiUrl with the headers
  //     Authorization: `Bearer ${config.ratesApiKey}` and Accept: "application/json"
  //   (never put the key in the URL)
  //   401 -> "The rates API rejected your key. Check RATES_API_KEY in your .env file."
  //   429 -> "You've used up the rates API's quota. Try again later."
  //   other !ok -> "Rates request failed: 500"
  //   parse with RatesSchema; no KES in the rates -> "The rates API didn't include KES"
  // TODO: kesPerDollar(): return the cached rate if it's less than CACHE_MS old (use now()),
  //   otherwise fetch a fresh one and remember when
  throw new Error("not implemented yet");
}
