// The service worker: it sits between the app and the network, so the app opens with no signal.
// The rules are in offline.ts (and tested); this just follows them.
import { APP_SHELL, VERSION, strategyFor, cachesToDelete } from "./offline.ts";

// Just the parts of the service worker world used here.
interface ExtendableEventLike extends Event {
  waitUntil(promise: Promise<unknown>): void;
}
interface FetchEventLike extends ExtendableEventLike {
  request: Request;
  respondWith(response: Promise<Response>): void;
}
const worker = self as unknown as {
  addEventListener(type: "install" | "activate", listener: (event: ExtendableEventLike) => void): void;
  addEventListener(type: "fetch", listener: (event: FetchEventLike) => void): void;
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  location: Location;
};

worker.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => worker.skipWaiting()));
});

worker.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(cachesToDelete(names).map((name) => caches.delete(name))))
      .then(() => worker.clients.claim()),
  );
});

async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(VERSION);
  try {
    const response = await fetch(request);
    if (response.ok) void cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match("./index.html")) ?? Response.error();
  }
}

async function cacheFirst(request: Request): Promise<Response> {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) void cache.put(request, response.clone());
  return response;
}

worker.addEventListener("fetch", (event) => {
  const strategy = strategyFor(event.request, worker.location.origin);
  if (strategy === "network-only") return;
  event.respondWith(strategy === "cache-first" ? cacheFirst(event.request) : networkFirst(event.request));
});
