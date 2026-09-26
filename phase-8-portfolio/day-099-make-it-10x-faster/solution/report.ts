import type { Season } from "./season.ts";

// Tikiti's end-of-season report, fast. The same answers as original-report.ts, in one pass over each
// list. What changed, found with `node --cpu-prof`:
//
//   1. A new Intl.DateTimeFormat for every order: building one is slow (it loads locale and time zone
//      data), using one is quick. Build it once. That alone was most of the time.
//   2. Searching inside loops: tickets.filter per order, users.find per order, orders.filter per event
//      and per user. Each is a scan of a whole list, inside a loop over another list: n × m. Group
//      each list once into a Map, then look things up.
//   3. Sorting the months after every order, and includes() on growing arrays: a Map or Set, sort once.

export interface Report {
  totals: { revenueKes: number; ticketsSold: number; checkedIn: number };
  events: { id: number; title: string; sold: number; revenueKes: number; checkedIn: number; showUpRate: number; topBuyer: string | null }[];
  months: { month: string; orders: number; revenueKes: number }[]; // "2026-08", in Nairobi
  busiestHour: { hour: number; orders: number }; // 0-23, in Nairobi
  topFans: { name: string; spentKes: number; events: number }[];
  repeatFans: number; // fans who bought for two or more different events
}

const NAIROBI = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", hour: "2-digit", hourCycle: "h23" });

// Many orders share an hour, so remember each hour's answer, keyed by the UTC ISO string up to the
// hour ("2026-08-01T13"). That's only safe because Nairobi's offset is a whole number of hours: in
// India (+05:30) one UTC hour spans two local ones.
const partsCache = new Map<string, { month: string; hour: number }>();
function nairobiParts(iso: string) {
  const key = iso.slice(0, 13);
  let parts = partsCache.get(key);
  if (!parts) {
    const p = NAIROBI.formatToParts(new Date(iso));
    const get = (type: string) => p.find((x) => x.type === type)!.value;
    parts = { month: `${get("year")}-${get("month")}`, hour: Number(get("hour")) };
    partsCache.set(key, parts);
  }
  return parts;
}

const byName = (a: { name: string; userId: number }, b: { name: string; userId: number }) => a.name.localeCompare(b.name) || a.userId - b.userId;

export function seasonReport(season: Season): Report {
  const names = new Map(season.users.map((u) => [u.id, u.name]));

  const checkedInByOrder = new Map<number, number>();
  for (const ticket of season.tickets) {
    if (ticket.checkedInAt !== null) checkedInByOrder.set(ticket.orderId, (checkedInByOrder.get(ticket.orderId) ?? 0) + 1);
  }

  interface EventTotals {
    sold: number;
    revenueKes: number;
    checkedIn: number;
    buyers: Map<number, number>; // userId -> tickets
  }
  const perEvent = new Map<number, EventTotals>(season.events.map((e) => [e.id, { sold: 0, revenueKes: 0, checkedIn: 0, buyers: new Map() }]));
  const perMonth = new Map<string, { orders: number; revenueKes: number }>();
  const perHour = new Array<number>(24).fill(0);
  const perFan = new Map<number, { spentKes: number; events: Set<number> }>();

  for (const order of season.orders) {
    if (order.status !== "paid") continue;
    const event = perEvent.get(order.eventId);
    if (event) {
      event.sold += order.quantity;
      event.revenueKes += order.amountKes;
      event.checkedIn += checkedInByOrder.get(order.id) ?? 0;
      event.buyers.set(order.userId, (event.buyers.get(order.userId) ?? 0) + order.quantity);
    }

    const { month, hour } = nairobiParts(order.createdAt);
    const m = perMonth.get(month);
    if (m) {
      m.orders++;
      m.revenueKes += order.amountKes;
    } else {
      perMonth.set(month, { orders: 1, revenueKes: order.amountKes });
    }
    perHour[hour]++;

    if (names.has(order.userId)) {
      let fan = perFan.get(order.userId);
      if (!fan) perFan.set(order.userId, (fan = { spentKes: 0, events: new Set() }));
      fan.spentKes += order.amountKes;
      fan.events.add(order.eventId);
    }
  }

  const events = season.events.map((e) => {
    const t = perEvent.get(e.id)!;
    // The top buyer, without sorting everyone: most tickets, then name, then id.
    let top: { userId: number; name: string; tickets: number } | null = null;
    for (const [userId, tickets] of t.buyers) {
      const candidate = { userId, name: names.get(userId)!, tickets };
      if (!top || tickets > top.tickets || (tickets === top.tickets && byName(candidate, top) < 0)) top = candidate;
    }
    const showUpRate = t.sold === 0 ? 0 : Math.round((t.checkedIn / t.sold) * 1000) / 1000;
    return { id: e.id, title: e.title, sold: t.sold, revenueKes: t.revenueKes, checkedIn: t.checkedIn, showUpRate, topBuyer: top?.name ?? null };
  });
  events.sort((a, b) => b.revenueKes - a.revenueKes || a.title.localeCompare(b.title));

  const months = [...perMonth].map(([month, m]) => ({ month, ...m })).sort((a, b) => a.month.localeCompare(b.month));

  let busiest = 0;
  for (let h = 1; h < 24; h++) if (perHour[h] > perHour[busiest]) busiest = h;

  const fans = [...perFan].map(([userId, f]) => ({ userId, name: names.get(userId)!, spentKes: f.spentKes, events: f.events.size }));
  const topFans = fans
    .filter((f) => f.spentKes > 0)
    .sort((a, b) => b.spentKes - a.spentKes || byName(a, b))
    .slice(0, 10)
    .map(({ name, spentKes, events }) => ({ name, spentKes, events }));

  let revenueKes = 0;
  let ticketsSold = 0;
  let checkedIn = 0;
  for (const e of events) {
    revenueKes += e.revenueKes;
    ticketsSold += e.sold;
    checkedIn += e.checkedIn;
  }

  return {
    totals: { revenueKes, ticketsSold, checkedIn },
    events,
    months,
    busiestHour: { hour: busiest, orders: perHour[busiest] },
    topFans,
    repeatFans: fans.filter((f) => f.events >= 2).length,
  };
}
