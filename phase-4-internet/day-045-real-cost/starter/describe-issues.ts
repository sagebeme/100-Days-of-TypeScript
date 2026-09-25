import type { z } from "zod";

// Day 44's helper: one readable line per problem.
export function describeIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => (issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message));
}
