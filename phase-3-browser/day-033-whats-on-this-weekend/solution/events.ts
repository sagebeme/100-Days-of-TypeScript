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
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.venue === "string" &&
    typeof item.date === "string" &&
    typeof item.time === "string" &&
    (item.priceKes === null || typeof item.priceKes === "number") &&
    Array.isArray(item.tags) &&
    item.tags.every((tag) => typeof tag === "string")
  );
}

export async function fetchEvents(url: string, fetchFn: Fetcher): Promise<EventItem[]> {
  const response = await fetchFn(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isEventItem)) {
    throw new Error("Unexpected response shape");
  }
  return data;
}

function toDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function weekendDates(today: string): [saturday: string, sunday: string] {
  const date = toDate(today);
  const weekday = date.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const daysToSaturday = weekday === 0 ? -1 : 6 - weekday;
  date.setUTCDate(date.getUTCDate() + daysToSaturday);
  const saturday = toDay(date);
  date.setUTCDate(date.getUTCDate() + 1);
  return [saturday, toDay(date)];
}

export function weekendEvents(events: EventItem[], today: string): EventItem[] {
  const weekend = weekendDates(today);
  return events
    .filter((event) => weekend.includes(event.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export function formatPrice(priceKes: number | null): string {
  return priceKes === null ? "Free" : `KES ${priceKes.toLocaleString("en-US")}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatWhen(event: EventItem): string {
  return `${DAY_NAMES[toDate(event.date).getUTCDay()]} ${event.time}`;
}
