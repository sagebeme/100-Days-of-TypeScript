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
  // TODO: no subscribers -> nothing to do (and nothing counts as announced)
  // TODO: for each new drop: send dropMessage(drop) to everyone, then report how many went through
  //   and which failed ({ number, status }), and add the drop's id to `announced`
  throw new Error("not implemented yet");
}
