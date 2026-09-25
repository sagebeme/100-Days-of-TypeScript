export interface EventItem {
  id: string;
  title: string;
  venue: string;
  date: string; // "2026-10-03"
  time: string; // "21:00"
  priceKes: number | null; // null means free
  tags: string[];
}

// Anything shaped like fetch: the real one in the browser, a fake one in the tests.
export type Fetcher = (url: string) => Promise<Response>;

export function isEventItem(value: unknown): value is EventItem {
  // TODO: an object with string id, title, venue, date and time,
  //       priceKes a number or null, and tags an array of strings
  throw new Error("not implemented yet");
}

export async function fetchEvents(url: string, fetchFn: Fetcher): Promise<EventItem[]> {
  // TODO: fetch; if !response.ok throw `Request failed: ${response.status}`
  // TODO: const data: unknown = await response.json()
  // TODO: not an array of events? throw "Unexpected response shape"
  throw new Error("not implemented yet");
}

export function weekendDates(today: string): [saturday: string, sunday: string] {
  // TODO: the coming Saturday and Sunday (in UTC), as "YYYY-MM-DD"
  //       Saturday -> today and tomorrow, Sunday -> yesterday and today
  throw new Error("not implemented yet");
}

export function weekendEvents(events: EventItem[], today: string): EventItem[] {
  // TODO: keep only the weekend's events, sorted by date then time, without changing `events`
  throw new Error("not implemented yet");
}

export function formatPrice(priceKes: number | null): string {
  // TODO: null -> "Free", 1500 -> "KES 1,500"
  throw new Error("not implemented yet");
}

export function formatWhen(event: EventItem): string {
  // TODO: "Sat 21:00" (the short day name from the date, then the time)
  throw new Error("not implemented yet");
}
