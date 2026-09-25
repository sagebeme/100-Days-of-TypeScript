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
  // TODO: the gap between requests is the bigger of minDelayMs and robots.txt's Crawl-delay (in ms)
  // TODO: return a fetch-like function that:
  //   - throws DisallowedError if robots.txt disallows the URL's path + query for this user agent
  //   - waits (options.sleep) until at least `gap` ms after the previous request started
  //   - sets the User-Agent header, keeping any other headers the caller passed
  throw new Error("not implemented yet");
}
