import { newDrops, dropMessage, type Drop } from "./drops.ts";
import type { SmsSender } from "./africas-talking.ts";

export interface AlertReport {
  drop: string;
  sent: number;
  failed: { number: string; status: string }[];
}

// Texts every subscriber about every drop they haven't heard about. Returns the ids now announced.
export async function alertNewDrops(
  drops: Drop[],
  seen: ReadonlySet<string>,
  subscribers: string[],
  sender: SmsSender,
): Promise<{ reports: AlertReport[]; announced: string[] }> {
  const reports: AlertReport[] = [];
  const announced: string[] = [];
  if (subscribers.length === 0) return { reports, announced };

  for (const drop of newDrops(drops, seen)) {
    const results = await sender.send(subscribers, dropMessage(drop));
    const failed = results.filter((r) => !r.ok).map((r) => ({ number: r.number, status: r.status }));
    reports.push({ drop: drop.id, sent: results.length - failed.length, failed });
    announced.push(drop.id);
  }
  return { reports, announced };
}
