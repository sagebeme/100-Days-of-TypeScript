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
  const response = await fetchFn(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ResponseShapeError(url, ["the body isn't JSON"]);
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ResponseShapeError(url, describeIssues(result.error));
  }
  return result.data;
}
