// The package's front door: only what's exported here is public. Everything else can change freely.
export { createLigiClient, LigiError, DEFAULT_BASE_URL } from "./client.ts";
export type { LigiClient, LigiClientOptions, DateRange, Fetcher } from "./client.ts";
export type { Standings, StandingsRow, Team, TeamRef, Fixture } from "./schemas.ts";
