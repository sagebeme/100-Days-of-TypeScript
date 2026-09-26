// Numbers and dates the way people in Nairobi read them. Pure functions: easy to test.

// 2500 -> "KES 2,500". 0 -> "Free".
export function formatKes(amount: number): string {
  if (amount === 0) return "Free";
  return `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(amount)}`;
}

// "2026-12-12T18:00:00+03:00" -> "Sat 12 Dec · 6:00 pm", always in Nairobi time, whatever
// time zone the phone reading it is set to.
export function formatWhen(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("weekday")} ${get("day")} ${get("month")} · ${get("hour")}:${get("minute")} ${get("dayPeriod").toLowerCase()}`;
}

export type Tone = "ok" | "low" | "sold-out" | "cancelled";

// What to say about seats. "Low" is 10% of the capacity or 20 seats, whichever is more.
export function availability(event: { status: string; available: number; capacity: number }): { tone: Tone; label: string } {
  if (event.status === "cancelled") return { tone: "cancelled", label: "Cancelled" };
  if (event.available <= 0) return { tone: "sold-out", label: "Sold out" };
  if (event.available <= Math.max(20, event.capacity * 0.1)) return { tone: "low", label: `Only ${event.available} left` };
  return { tone: "ok", label: "On sale" };
}
