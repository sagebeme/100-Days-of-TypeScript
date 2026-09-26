// The rules the service worker follows, as plain functions the tests can check. sw.ts applies them.
export const VERSION = "streaks-v1";

// The files the app needs to open with no network at all.
export const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];

export type Strategy = "network-first" | "cache-first" | "network-only";

// Pages: try the network, so an update shows up; fall back to the cache offline.
// Built files with a hash in their name never change, so the cache is always right for them.
// Anything else (other sites, non-GET requests): leave it alone.
export function strategyFor(request: { url: string; method: string; mode?: string }, origin: string): Strategy {
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== origin) return "network-only";
  if (request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html")) return "network-first";
  if (/\/assets\/.+-[\w-]{8,}\.(js|css|svg|png|woff2?)$/.test(url.pathname) || /\.(svg|png|webmanifest)$/.test(url.pathname)) return "cache-first";
  return "network-first";
}

// When a new version takes over, the old caches are deleted: they'd only waste the phone's storage.
export function cachesToDelete(names: string[], current = VERSION): string[] {
  return names.filter((name) => name.startsWith("streaks-") && name !== current);
}
