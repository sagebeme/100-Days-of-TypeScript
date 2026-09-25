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
  const method = (init.method ?? "GET").toUpperCase();
  return SAFE_METHODS.has(method) || new Headers(init.headers).has("Idempotency-Key");
}

// Retry-After is either seconds ("120") or a date ("Wed, 21 Oct 2026 07:28:00 GMT").
export function parseRetryAfter(header: string | null, now: number): number | null {
  if (header === null || header.trim() === "") return null;
  if (/^\d+$/.test(header.trim())) return Number(header) * 1000;
  const at = Date.parse(header);
  return Number.isNaN(at) ? null : Math.max(at - now, 0);
}

// Exponential backoff with "full jitter": a random wait between 0 and the capped exponential,
// so a thousand phones that lost Wi-Fi together don't all retry at the same instant.
export function backoffDelay(attempt: number, options: Pick<RetryOptions, "baseDelayMs" | "maxDelayMs" | "random">): number {
  const ceiling = Math.min(options.maxDelayMs, options.baseDelayMs * 2 ** attempt);
  return Math.round(options.random() * ceiling);
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
  const options = { ...DEFAULTS, ...overrides };
  const attempts = isRepeatable(init) ? options.retries + 1 : 1;

  for (let attempt = 0; ; attempt++) {
    const last = attempt === attempts - 1;
    const timeout = AbortSignal.timeout(options.timeoutMs);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;

    let reason: string;
    let serverWait: number | null = null;
    try {
      const response = await fetchFn(url, { ...init, signal });
      if (!RETRYABLE_STATUSES.has(response.status) || last) {
        return response; // success, a status not worth retrying, or out of attempts: the caller decides
      }
      reason = `status ${response.status}`;
      serverWait = parseRetryAfter(response.headers.get("Retry-After"), options.now());
    } catch (error) {
      if (init.signal?.aborted) throw error; // the caller cancelled: stop, don't retry
      reason = describe(error);
      if (last) {
        throw new NetworkError(`Gave up after ${attempts} attempt${attempts === 1 ? "" : "s"}: ${reason}`, { cause: error });
      }
    }

    // A server that says how long to wait knows best (within reason).
    const delayMs = serverWait !== null ? Math.min(serverWait, options.maxDelayMs * 4) : backoffDelay(attempt, options);
    options.onRetry?.({ attempt: attempt + 1, delayMs, reason });
    await options.sleep(delayMs);
  }
}
