import type { Season } from "./season.ts";

// Already written: the report exactly as it was, kept so the tests can check yours gives the same answers.

export interface Report {
  totals: { revenueKes: number; ticketsSold: number; checkedIn: number };
  events: { id: number; title: string; sold: number; revenueKes: number; checkedIn: number; showUpRate: number; topBuyer: string | null }[];
  months: { month: string; orders: number; revenueKes: number }[]; // "2026-08", in Nairobi
  busiestHour: { hour: number; orders: number }; // 0-23, in Nairobi
  topFans: { name: string; spentKes: number; events: number }[];
  repeatFans: number; // fans who bought for two or more different events
}

function nairobiParts(iso: string) {
  const format = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", hour: "2-digit", hourCycle: "h23" });
  const parts = format.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { month: `${get("year")}-${get("month")}`, hour: Number(get("hour")) };
}

export function seasonReport(season: Season): Report {
  const paid = season.orders.filter((o) => o.status === "paid");

  const events = season.events.map((event) => {
    const eventOrders = paid.filter((o) => o.eventId === event.id);
    let sold = 0;
    let revenueKes = 0;
    let checkedIn = 0;
    const buyers: { userId: number; name: string; tickets: number }[] = [];
    for (const order of eventOrders) {
      sold += order.quantity;
      revenueKes += order.amountKes;
      const tickets = season.tickets.filter((t) => t.orderId === order.id);
      checkedIn += tickets.filter((t) => t.checkedInAt !== null).length;
      const user = season.users.find((u) => u.id === order.userId)!;
      const buyer = buyers.find((b) => b.userId === user.id);
      if (buyer) buyer.tickets += order.quantity;
      else buyers.push({ userId: user.id, name: user.name, tickets: order.quantity });
    }
    buyers.sort((a, b) => b.tickets - a.tickets || a.name.localeCompare(b.name) || a.userId - b.userId);
    const showUpRate = sold === 0 ? 0 : Math.round((checkedIn / sold) * 1000) / 1000;
    return { id: event.id, title: event.title, sold, revenueKes, checkedIn, showUpRate, topBuyer: buyers[0]?.name ?? null };
  });
  events.sort((a, b) => b.revenueKes - a.revenueKes || a.title.localeCompare(b.title));

  const months: Report["months"] = [];
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 }));
  for (const order of paid) {
    const { month, hour } = nairobiParts(order.createdAt);
    hours.find((h) => h.hour === hour)!.orders++;
    const row = months.find((m) => m.month === month);
    if (row) {
      row.orders++;
      row.revenueKes += order.amountKes;
    } else {
      months.push({ month, orders: 1, revenueKes: order.amountKes });
    }
    months.sort((a, b) => a.month.localeCompare(b.month));
  }

  const busiestHour = [...hours].sort((a, b) => b.orders - a.orders || a.hour - b.hour)[0];

  const fans = season.users.map((user) => {
    const theirs = paid.filter((o) => o.userId === user.id);
    const eventIds: number[] = [];
    for (const order of theirs) if (!eventIds.includes(order.eventId)) eventIds.push(order.eventId);
    return { userId: user.id, name: user.name, spentKes: theirs.reduce((sum, o) => sum + o.amountKes, 0), events: eventIds.length };
  });
  const topFans = fans
    .filter((f) => f.spentKes > 0)
    .sort((a, b) => b.spentKes - a.spentKes || a.name.localeCompare(b.name) || a.userId - b.userId)
    .slice(0, 10)
    .map(({ name, spentKes, events }) => ({ name, spentKes, events }));
  const repeatFans = fans.filter((f) => f.events >= 2).length;

  const totals = {
    revenueKes: events.reduce((sum, e) => sum + e.revenueKes, 0),
    ticketsSold: events.reduce((sum, e) => sum + e.sold, 0),
    checkedIn: events.reduce((sum, e) => sum + e.checkedIn, 0),
  };

  return { totals, events, months, busiestHour, topFans, repeatFans };
}
