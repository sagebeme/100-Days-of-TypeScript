// A fixed-window rate limiter: at most `limit` hits per key in each window of `windowMs`.
// Simple, and enough to turn "a million password guesses" into "five a minute".
export interface Verdict {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number; // 0 when allowed
}

export interface RateLimiter {
  hit(key: string): Verdict;
  reset(key: string): void;
}

export function createRateLimiter(options: { limit: number; windowMs: number; now?: () => number }): RateLimiter {
  // TODO: keep a { start, count } window per key (a Map).
  // TODO: hit(key): if there's no window, or it's older than windowMs, start a new one at now(). Add 1.
  //   Over the limit -> { allowed: false, remaining: 0, retryAfterSeconds: seconds until the window ends (rounded up) }
  //   Otherwise      -> { allowed: true, remaining: limit - count, retryAfterSeconds: 0 }
  // TODO: reset(key): forget the key's window
  throw new Error("not implemented yet");
}
