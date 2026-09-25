import { getElement } from "./dom.ts";
import { fetchEvents, weekendEvents, formatPrice, formatWhen, type EventItem, type Fetcher } from "./events.ts";

export interface EventsOptions {
  url: string;
  today: string;
  fetchFn: Fetcher;
}

// Resolves once the first load has finished (whether it worked or not).
export async function mountEvents(root: ParentNode, options: EventsOptions): Promise<void> {
  // TODO: find #status, #list, #retry (HTMLButtonElement) and #free-only (HTMLInputElement)
  // TODO: let events: EventItem[] = []

  // TODO: draw(): filter by #free-only, then fill #list with <li><h2>…</h2><p>Sat 21:00 · venue</p><p class="price">…</p></li>
  //       built with createElement + textContent, and set #status:
  //       "3 events this weekend" / "1 event this weekend" / "Nothing on this weekend. Rest up."

  // TODO: async load(): "Loading…", hide #retry, fetch, keep the weekend's events, draw()
  //       on failure: "Couldn't load events. Check your connection and try again." and show #retry

  // TODO: #free-only change -> draw() (no new fetch); #retry click -> load()
  // TODO: await load()
  throw new Error("not implemented yet");
}
