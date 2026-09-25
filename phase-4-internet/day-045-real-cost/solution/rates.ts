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
  let cached: { rate: number; at: number } | undefined;

  async function fetchRate(): Promise<number> {
    // The key goes in a header. URLs end up in logs, browser history and error messages; headers don't.
    const response = await fetchFn(config.ratesApiUrl, {
      headers: { Authorization: `Bearer ${config.ratesApiKey}`, Accept: "application/json" },
    });
    if (response.status === 401) {
      throw new Error("The rates API rejected your key. Check RATES_API_KEY in your .env file.");
    }
    if (response.status === 429) {
      throw new Error("You've used up the rates API's quota. Try again later.");
    }
    if (!response.ok) {
      throw new Error(`Rates request failed: ${response.status}`);
    }
    const data = RatesSchema.parse(await response.json());
    const rate = data.rates.KES;
    if (rate === undefined) {
      throw new Error("The rates API didn't include KES");
    }
    return rate;
  }

  return {
    async kesPerDollar() {
      if (cached && now() - cached.at < CACHE_MS) {
        return cached.rate;
      }
      const rate = await fetchRate();
      cached = { rate, at: now() };
      return rate;
    },
  };
}
