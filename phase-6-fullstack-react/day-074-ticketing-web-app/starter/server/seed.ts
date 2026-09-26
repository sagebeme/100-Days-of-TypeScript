import { hashPassword } from "./passwords.ts";
import type { Database } from "./db.ts";

// Already written: a fresh database gets an organiser, a fan and some events, so there's something
// to look at. These are test accounts for this practice app only.
export const SEED_ACCOUNTS = {
  organiser: { email: "organiser@tikiti.example", name: "Wanjiru Kamau", password: "tikiti-organiser-demo" },
  fan: { email: "fan@tikiti.example", name: "Amina Otieno", password: "tikiti-fan-demo" },
};

const EVENTS = [
  { title: "Jioni Jazz Night", venue: "Uhuru Gardens", startsAt: "2026-12-12T18:00:00+03:00", priceKes: 2500, capacity: 500 },
  { title: "Gengetone Block Party", venue: "Kasarani Annex", startsAt: "2026-12-05T15:00:00+03:00", priceKes: 800, capacity: 40 },
  { title: "Benga Sundowner", venue: "Karura Forest Glade", startsAt: "2026-12-06T16:30:00+03:00", priceKes: 1500, capacity: 300 },
  { title: "Afrobeats in the Park", venue: "Central Park, Nairobi", startsAt: "2026-12-19T14:00:00+03:00", priceKes: 3000, capacity: 2000 },
];

export async function seed(database: Database): Promise<void> {
  const { sqlite } = database;
  const already = sqlite.prepare("SELECT count(*) AS n FROM users").get() as { n: number };
  if (already.n > 0) return;
  const now = new Date().toISOString();
  const addUser = sqlite.prepare("INSERT INTO users (email, name, password_hash, created_at, role) VALUES (?, ?, ?, ?, ?)");
  const organiser = addUser.run(SEED_ACCOUNTS.organiser.email, SEED_ACCOUNTS.organiser.name, await hashPassword(SEED_ACCOUNTS.organiser.password), now, "organiser");
  addUser.run(SEED_ACCOUNTS.fan.email, SEED_ACCOUNTS.fan.name, await hashPassword(SEED_ACCOUNTS.fan.password), now, "fan");
  const addEvent = sqlite.prepare(
    "INSERT INTO events (organiser_id, title, venue, starts_at, price_kes, capacity, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'published', ?)",
  );
  for (const e of EVENTS) addEvent.run(organiser.lastInsertRowid, e.title, e.venue, e.startsAt, e.priceKes, e.capacity, now);
}
