import { z } from "zod";
import { describeIssues } from "./schemas.ts";

export type Fetcher = (url: string) => Promise<Response>;

// Thrown when a server answers, but not with the shape we were promised.
export class ResponseShapeError extends Error {
  readonly problems: string[];

  constructor(url: string, problems: string[]) {
    super(`Unexpected response from ${url}: ${problems.join("; ")}`);
    this.name = "ResponseShapeError";
    this.problems = problems;
  }
}

// One function for every API: fetch, check the status, check the shape.
// The return type is whatever the schema produces, so callers get real types without a single `as`.
export async function fetchJson<Schema extends z.ZodType>(
  url: string,
  schema: Schema,
  fetchFn: Fetcher,
): Promise<z.output<Schema>> {
  // TODO: fetch; a status that isn't ok -> "Request failed: 404"
  // TODO: read the JSON; if it isn't JSON -> ResponseShapeError(url, ["the body isn't JSON"])
  // TODO: schema.safeParse; if it fails -> ResponseShapeError(url, describeIssues(error))
  // TODO: return the parsed data (already the right type: no `as` needed)
  throw new Error("not implemented yet");
}
