// Already written: what the bot needs from the ticketing API (Day 66), a client for it, and a demo
// version with made-up events so you can run the bot without the API.

export interface TikitiEvent {
  id: number;
  title: string;
  venue: string;
  startsAt: string; // ISO
  priceKes: number;
  seatsLeft: number;
}

// "at" is when it got in, if the API says. Day 66's API only says so in words, so its client gives null.
export type CheckInResult = { status: "admitted"; holder: string } | { status: "used"; at: string | null } | { status: "invalid" };

export interface Tikiti {
  upcomingEvents(): Promise<TikitiEvent[]>; // soonest first
  checkIn(eventId: number, code: string): Promise<CheckInResult>;
  remind(discordUserId: string, eventId: number): Promise<void>;
}

export function tikitiApi(baseUrl: string, staffCookie: string): Tikiti {
  const call = async (path: string, init?: RequestInit) => {
    const response = await fetch(new URL(path, baseUrl), { ...init, headers: { "Content-Type": "application/json", Cookie: staffCookie } });
    return { status: response.status, body: (await response.json().catch(() => ({}))) as Record<string, unknown> };
  };
  return {
    async upcomingEvents() {
      const { status, body } = await call("/events");
      if (status !== 200) throw new Error(`Tikiti answered ${status}`);
      const now = Date.now();
      return (body.events as (Omit<TikitiEvent, "seatsLeft"> & { available: number })[])
        .filter((e) => Date.parse(e.startsAt) > now)
        .map(({ id, title, venue, startsAt, priceKes, available }) => ({ id, title, venue, startsAt, priceKes, seatsLeft: available }));
    },
    async checkIn(eventId, code) {
      const { status, body } = await call(`/events/${eventId}/check-in`, { method: "POST", body: JSON.stringify({ code }) });
      if (status === 200) return { status: "admitted", holder: String(body.holder) };
      if (status === 409) return { status: "used", at: typeof body.checkedInAt === "string" ? body.checkedInAt : null };
      if (status === 404 || status === 400) return { status: "invalid" };
      throw new Error(`Tikiti answered ${status}`);
    },
    // Day 66 has no reminders route yet: adding one (and a job that sends them) is this day's stretch.
    async remind(discordUserId, eventId) {
      const { status } = await call(`/events/${eventId}/reminders`, { method: "POST", body: JSON.stringify({ discordUserId }) });
      if (status >= 300) throw new Error(`Tikiti answered ${status}`);
    },
  };
}

export function demoTikiti(): Tikiti {
  const events: TikitiEvent[] = [
    { id: 1, title: "Jioni Jazz Night", venue: "Uhuru Gardens", startsAt: "2026-12-12T18:00:00+03:00", priceKes: 1000, seatsLeft: 412 },
    { id: 2, title: "Sauti za Pwani", venue: "Fort Jesus, Mombasa", startsAt: "2026-12-19T16:00:00+03:00", priceKes: 1500, seatsLeft: 12 },
    { id: 3, title: "Nairobi Comedy Store", venue: "Kenya National Theatre", startsAt: "2026-12-20T19:30:00+03:00", priceKes: 800, seatsLeft: 0 },
  ];
  const used = new Map<string, string>();
  return {
    upcomingEvents: async () => events,
    async checkIn(_eventId, code) {
      if (!/^T\d+-[0-9A-F]{16}$/.test(code)) return { status: "invalid" };
      const at = used.get(code);
      if (at) return { status: "used", at };
      used.set(code, new Date().toISOString());
      return { status: "admitted", holder: "Demo fan" };
    },
    remind: async () => {},
  };
}
