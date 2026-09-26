// Numbers and dates the way people in Nairobi read them. Pure functions: easy to test.

// TODO: 2500 -> "KES 2,500" (Intl.NumberFormat, "en-KE"). 0 -> "Free".
export function formatKes(amount: number): string {
  return String(amount);
}

// TODO: "2026-12-12T18:00:00+03:00" -> "Sat 12 Dec · 6:00 pm", always in Nairobi time
// (timeZone: "Africa/Nairobi"), whatever time zone the phone reading it is set to.
// Intl.DateTimeFormat("en-GB", {...}).formatToParts gives you the pieces: weekday, day, month,
// hour, minute, dayPeriod. Put them together yourself, so the result is exactly this shape.
export function formatWhen(iso: string): string {
  return iso;
}

export type Tone = "ok" | "low" | "sold-out" | "cancelled";

// TODO: what to say about seats, in this order:
// - cancelled: { tone: "cancelled", label: "Cancelled" }
// - none left: { tone: "sold-out", label: "Sold out" }
// - 10% of the capacity or 20 seats (whichever is more) or fewer: { tone: "low", label: "Only 14 left" }
// - otherwise: { tone: "ok", label: "On sale" }
export function availability(event: { status: string; available: number; capacity: number }): { tone: Tone; label: string } {
  void event;
  return { tone: "ok", label: "" };
}
