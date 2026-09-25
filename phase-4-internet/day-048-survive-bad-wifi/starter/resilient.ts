export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface RetryOptions {
  retries: number; // extra attempts after the first
  timeoutMs: number; // per attempt
  baseDelayMs: number;
  maxDelayMs: number;
  random: () => number; // Math.random, or a fake in tests
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  onRetry?: (info: { attempt: number; delayMs: number; reason: string }) => void;
}

export const DEFAULTS: RetryOptions = {
  retries: 3,
  timeoutMs: 8000,
  baseDelayMs: 500,
  maxDelayMs: 8000,
  random: Math.random,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: Date.now,
};

// Gave up: every attempt failed. `cause` is the last error.
export class NetworkError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "NetworkError";
  }
}

// Worth trying again: the server was busy or broken for a moment. Not worth it: you asked for something wrong.
export const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

// Safe to repeat: asking twice gives the same result. A POST might charge someone twice.
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);

export function isRepeatable(init: RequestInit = {}): boolean {
  // TODO: true for a safe method (GET is the default), or when the headers include an Idempotency-Key
  throw new Error("not implemented yet");
}

// Retry-After is either seconds ("120") or a date ("Wed, 21 Oct 2026 07:28:00 GMT").
export function parseRetryAfter(header: string | null, now: number): number | null {
  // TODO: null or blank -> null; whole seconds -> milliseconds;
  //       an HTTP date -> milliseconds from `now` until then (0 if it's passed); anything else -> null
  throw new Error("not implemented yet");
}

// Exponential backoff with "full jitter": a random wait between 0 and the capped exponential,
// so a thousand phones that lost Wi-Fi together don't all retry at the same instant.
export function backoffDelay(attempt: number, options: Pick<RetryOptions, "baseDelayMs" | "maxDelayMs" | "random">): number {
  // TODO: the ceiling is baseDelayMs * 2 ** attempt, but never more than maxDelayMs.
  //       Return a random wait between 0 and the ceiling (random() * ceiling), rounded.
  throw new Error("not implemented yet");
}

function describe(error: unknown): string {
  if (error instanceof DOMException && (error.name === "TimeoutError" || error.name === "AbortError")) return "timed out";
  return error instanceof Error ? error.message : String(error);
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  fetchFn: Fetcher,
  overrides: Partial<RetryOptions> = {},
): Promise<Response> {
  // TODO: options = DEFAULTS with the overrides on top. A request that isn't repeatable gets 1 attempt only.
  // TODO: for each attempt:
  //   - a signal that times out after timeoutMs (AbortSignal.timeout), combined with init.signal
  //     if the caller passed one (AbortSignal.any)
  //   - a response with a RETRYABLE status, when there are attempts left: retry (reason "status 503").
  //     Any other response, or the last attempt: return it.
  //   - an error: if the caller's own signal aborted, rethrow it. On the last attempt, throw
  //     NetworkError("Gave up after 4 attempts: <reason>", { cause }). A timeout's reason is "timed out"
  //     (use describe(error)).
  //   - before retrying: wait parseRetryAfter(...) if the server sent Retry-After (at most maxDelayMs * 4),
  //     otherwise backoffDelay(attempt). Call onRetry({ attempt: attempt + 1, delayMs, reason }), then sleep.
  throw new Error("not implemented yet");
}
