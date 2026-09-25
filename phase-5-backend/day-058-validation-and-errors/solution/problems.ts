import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { z } from "zod";

// Problem Details (RFC 9457): the standard shape for API errors, so every client can read every error the same way.
export interface FieldError {
  field: string; // "priceKes", "near", or "" for the whole body
  message: string;
}

export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  errors?: FieldError[];
}

export class ProblemError extends Error {
  readonly problem: Problem;

  constructor(problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = "ProblemError";
    this.problem = problem;
  }
}

export const TITLES: Record<number, string> = {
  400: "Bad request",
  404: "Not found",
  413: "Content too large",
  415: "Unsupported media type",
  422: "Validation failed",
  500: "Internal server error",
};

export function problem(status: number, detail?: string, errors?: FieldError[]): ProblemError {
  return new ProblemError({
    type: status === 422 ? "https://docs.example/problems/validation" : "about:blank",
    title: TITLES[status] ?? "Error",
    status,
    ...(detail !== undefined && { detail }),
    ...(errors !== undefined && { errors }),
  });
}

// Zod's issues, as a list a form can show next to each field.
export function fieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
}

export function sendProblem(c: Context, value: Problem): Response {
  return c.body(JSON.stringify(value), value.status as ContentfulStatusCode, { "Content-Type": "application/problem+json" });
}

// The single error handler: every failure, from anywhere in the app, leaves as a Problem.
export function handleErrors(log: (line: string) => void = () => {}) {
  return (error: Error, c: Context): Response => {
    if (error instanceof ProblemError) return sendProblem(c, error.problem);
    if (error instanceof HTTPException) return sendProblem(c, problem(error.status, error.message).problem);
    log(`Unexpected error on ${c.req.method} ${c.req.path}: ${error.stack ?? error.message}`);
    return sendProblem(c, problem(500, "Something went wrong on our side").problem);
  };
}
