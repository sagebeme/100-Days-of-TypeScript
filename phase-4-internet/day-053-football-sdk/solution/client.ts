import { z } from "zod";
import { StandingsSchema, TeamSchema, FixturesSchema, ErrorBodySchema, type Standings, type Team, type Fixture } from "./schemas.ts";

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

// One error class, so users can write `catch (e) { if (e instanceof LigiError && e.status === 404) … }`.
export class LigiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | null;

  constructor(message: string, status: number, code: string, retryAfterSeconds: number | null = null) {
    super(message);
    this.name = "LigiError";
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface LigiClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: Fetcher; // for tests, or to add retries (Day 48)
}

export interface DateRange {
  from?: string; // "2026-10-01"
  to?: string;
}

export interface LigiClient {
  standings(league?: string): Promise<Standings>;
  team(teamId: string): Promise<Team>;
  fixtures(teamId: string, range?: DateRange): Promise<Fixture[]>;
}

export const DEFAULT_BASE_URL = "https://api.ligi.example/v1";

export function createLigiClient(options: LigiClientOptions): LigiClient {
  if (!options.apiKey) {
    throw new TypeError("createLigiClient needs an apiKey");
  }
  const base = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const fetchFn = options.fetch ?? ((url, init) => fetch(url, init));

  async function get<Schema extends z.ZodType>(path: string, schema: Schema): Promise<z.output<Schema>> {
    const response = await fetchFn(`${base}${path}`, {
      headers: { "X-Api-Key": options.apiKey, Accept: "application/json" },
    });
    if (!response.ok) {
      const body = ErrorBodySchema.safeParse(await response.json().catch(() => null));
      const retryAfter = response.headers.get("Retry-After");
      throw new LigiError(
        body.success ? body.data.error.message : `Ligi API request failed with status ${response.status}`,
        response.status,
        body.success ? body.data.error.code : "http_error",
        retryAfter !== null && /^\d+$/.test(retryAfter) ? Number(retryAfter) : null,
      );
    }
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) {
      throw new LigiError("The Ligi API sent data this version of the SDK doesn't understand", response.status, "bad_response");
    }
    return parsed.data;
  }

  const segment = (value: string) => encodeURIComponent(value);

  return {
    standings: (league = "kpl") => get(`/leagues/${segment(league)}/standings`, StandingsSchema),
    team: (teamId) => get(`/teams/${segment(teamId)}`, TeamSchema),
    async fixtures(teamId, range = {}) {
      const query = new URLSearchParams();
      if (range.from) query.set("from", range.from);
      if (range.to) query.set("to", range.to);
      const qs = query.size > 0 ? `?${query}` : "";
      return (await get(`/teams/${segment(teamId)}/fixtures${qs}`, FixturesSchema)).fixtures;
    },
  };
}
