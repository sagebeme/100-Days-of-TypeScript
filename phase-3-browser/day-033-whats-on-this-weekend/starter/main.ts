import { mountEvents } from "./app.ts";

// The sample events.json is for the first weekend of October 2026, so "today" is fixed
// to that Thursday. Pointed at a real events API, you'd use today's date instead:
//   new Date().toISOString().slice(0, 10)
void mountEvents(document, { url: "./events.json", today: "2026-10-01", fetchFn: fetch });
