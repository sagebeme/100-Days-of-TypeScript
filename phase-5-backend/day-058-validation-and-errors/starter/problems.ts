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
  // TODO: a ProblemError whose problem is { type, title, status, detail?, errors? }:
  //   type "https://docs.example/problems/validation" for 422, otherwise "about:blank"
  //   title from TITLES (or "Error"); leave detail and errors out entirely when they're undefined
  throw new Error("not implemented yet");
}

// Zod's issues, as a list a form can show next to each field.
export function fieldErrors(error: z.ZodError): FieldError[] {
  // TODO: { field: the path joined with ".", message } for each issue
  throw new Error("not implemented yet");
}

export function sendProblem(c: Context, value: Problem): Response {
  return c.body(JSON.stringify(value), value.status as ContentfulStatusCode, { "Content-Type": "application/problem+json" });
}

// The single error handler: every failure, from anywhere in the app, leaves as a Problem.
export function handleErrors(log: (line: string) => void = () => {}) {
  return (error: Error, c: Context): Response => {
    // TODO: ProblemError -> sendProblem(c, error.problem)
    // TODO: HTTPException (Hono's own, like broken JSON) -> a problem with its status and message
    // TODO: anything else -> log "Unexpected error on <METHOD> <path>: <stack>", then a 500 problem
    //   with detail "Something went wrong on our side"
    void HTTPException;
    void log;
    return c.json({ error: error.message }, 500);
  };
}
