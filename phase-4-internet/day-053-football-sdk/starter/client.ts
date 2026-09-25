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
    // TODO: set this.name to "LigiError", and store status, code and retryAfterSeconds
    this.status = 0;
    this.code = "";
    this.retryAfterSeconds = null;
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
  // TODO: no apiKey -> throw new TypeError("createLigiClient needs an apiKey")
  // TODO: base = options.baseUrl (or DEFAULT_BASE_URL) without trailing slashes; fetch = options.fetch or fetch
  // TODO: a private get(path, schema): GET base + path with headers X-Api-Key and Accept: application/json.
  //   Not ok -> LigiError with the API's own { error: { code, message } } if the body has one,
  //     otherwise message "Ligi API request failed with status <status>" and code "http_error".
  //     Include Retry-After (whole seconds) when the server sent it.
  //   Ok but the wrong shape -> LigiError("The Ligi API sent data this version of the SDK doesn't understand",
  //     status, "bad_response")
  // TODO: standings(league = "kpl") -> GET /leagues/<league>/standings
  //       team(id)                   -> GET /teams/<id>
  //       fixtures(id, { from, to }) -> GET /teams/<id>/fixtures?from=…&to=… (only the ones given), returns the list
  //   encodeURIComponent every id that goes into a path
  throw new Error("not implemented yet");
}
