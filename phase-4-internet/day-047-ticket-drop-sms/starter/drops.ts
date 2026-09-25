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
  // TODO: the drops whose id isn't in `seen`
  throw new Error("not implemented yet");
}

const shortDate = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", weekday: "short", day: "numeric", month: "short" });

// One SMS, always: a second part doubles the bill for every subscriber.
export function dropMessage(drop: Drop): string {
  // TODO: "TICKETS OUT: <event> @ <venue>, <Sat 14 Nov>. From KES <3,500>. <url> Reply STOP to opt out"
  //   (use shortDate for the date, and run the whole message through toGsmFriendly)
  // TODO: while it needs more than one SMS, drop the event name's last word and add "..."
  //   (also trim any spaces, commas, & or - left at the end before the "...")
  // TODO: if even a one-word name doesn't fit, throw `Can't fit drop <id> into one SMS`
  throw new Error("not implemented yet");
}
