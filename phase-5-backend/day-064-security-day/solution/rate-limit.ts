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
  const now = options.now ?? Date.now;
  const windows = new Map<string, { start: number; count: number }>();

  return {
    hit(key) {
      const t = now();
      let window = windows.get(key);
      if (!window || t - window.start >= options.windowMs) {
        window = { start: t, count: 0 };
        windows.set(key, window);
      }
      window.count += 1;
      if (window.count > options.limit) {
        return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((window.start + options.windowMs - t) / 1000) };
      }
      return { allowed: true, remaining: options.limit - window.count, retryAfterSeconds: 0 };
    },
    reset(key) {
      windows.delete(key);
    },
  };
}
