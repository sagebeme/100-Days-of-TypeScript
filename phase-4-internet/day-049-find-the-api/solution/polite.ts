import { isAllowed, crawlDelay, type Group } from "./robots.ts";

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export class DisallowedError extends Error {
  constructor(url: string) {
    super(`robots.txt asks bots not to fetch ${url}`);
    this.name = "DisallowedError";
  }
}

export interface PoliteOptions {
  robots: Group[];
  userAgent: string; // say who you are and how to reach you
  minDelayMs: number; // your own floor, even if robots.txt doesn't ask for one
  fetchFn: Fetcher;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
}

// A fetch that obeys robots.txt, identifies itself, and never hurries the server.
export function politeFetcher(options: PoliteOptions): Fetcher {
  const askedMs = (crawlDelay(options.robots, options.userAgent) ?? 0) * 1000;
  const gapMs = Math.max(options.minDelayMs, askedMs);
  let lastAt: number | null = null;

  return async (url, init = {}) => {
    const { pathname, search } = new URL(url);
    if (!isAllowed(options.robots, options.userAgent, pathname + search)) {
      throw new DisallowedError(url);
    }
    if (lastAt !== null) {
      const wait = lastAt + gapMs - options.now();
      if (wait > 0) await options.sleep(wait);
    }
    lastAt = options.now();

    const headers = new Headers(init.headers);
    headers.set("User-Agent", options.userAgent);
    return options.fetchFn(url, { ...init, headers });
  };
}
