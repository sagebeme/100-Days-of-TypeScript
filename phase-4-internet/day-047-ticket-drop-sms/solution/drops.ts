import { z } from "zod";
import { smsInfo, toGsmFriendly } from "./sms-text.ts";

export const DropSchema = z.object({
  id: z.string().min(1),
  event: z.string().min(1),
  venue: z.string().min(1),
  date: z.iso.date(),
  priceKes: z.number().int().positive(),
  url: z.url(),
});

export type Drop = z.infer<typeof DropSchema>;

export function newDrops(drops: Drop[], seen: ReadonlySet<string>): Drop[] {
  return drops.filter((drop) => !seen.has(drop.id));
}

const shortDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", weekday: "short", day: "numeric", month: "short" });

// One SMS, always: a second part doubles the bill for every subscriber.
export function dropMessage(drop: Drop): string {
  const date = shortDate.format(new Date(`${drop.date}T12:00:00Z`));
  const build = (event: string) =>
    toGsmFriendly(
      `TICKETS OUT: ${event} @ ${drop.venue}, ${date}. From KES ${drop.priceKes.toLocaleString("en-US")}. ${drop.url} Reply STOP to opt out`,
    );

  // Too long? Shorten the event name, a whole word at a time. Never the price, the link or the opt-out.
  const words = toGsmFriendly(drop.event).split(" ");
  let message = build(words.join(" "));
  while (smsInfo(message).parts > 1 && words.length > 1) {
    words.pop();
    message = build(`${words.join(" ").replace(/[\s,&-]+$/, "")}...`);
  }
  if (smsInfo(message).parts > 1) {
    throw new Error(`Can't fit drop ${drop.id} into one SMS`);
  }
  return message;
}
