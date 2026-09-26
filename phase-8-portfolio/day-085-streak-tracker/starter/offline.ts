// The rules your service worker follows, as plain functions the tests can check.
export const VERSION = "streaks-v1";

export const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

export type Strategy = "network-first" | "cache-first" | "network-only";

export function strategyFor(request: { url: string; method: string; mode?: string }, origin: string): Strategy {
  throw new Error(`TODO: strategyFor(${request.method} ${request.url}, ${origin})`);
}

export function cachesToDelete(names: string[], current = VERSION): string[] {
  throw new Error(`TODO: cachesToDelete(${names.length}, ${current})`);
}
