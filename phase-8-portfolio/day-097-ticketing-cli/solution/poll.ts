import { Unreachable, type Order } from "./api.ts";

export interface WaitOptions {
  intervalMs: number;
  timeoutMs: number;
  sleep(ms: number): Promise<void>;
  now(): number;
  onWait?(elapsedMs: number): void; // for a "Waiting for M-Pesa… 12s" line
}

export const MAX_BLIPS = 3;

// Ask about the order until M-Pesa has an answer (anything but "pending"), or until we give up.
// A network blip is fine; that many in a row isn't.
export async function waitForOrder(getOrder: () => Promise<Order>, options: WaitOptions): Promise<{ order: Order | null; timedOut: boolean }> {
  const started = options.now();
  let last: Order | null = null;
  let blips = 0;
  while (true) {
    try {
      last = await getOrder();
      blips = 0;
      if (last.status !== "pending") return { order: last, timedOut: false };
    } catch (error) {
      if (!(error instanceof Unreachable) || ++blips >= MAX_BLIPS) throw error;
    }
    const elapsed = options.now() - started;
    if (elapsed + options.intervalMs > options.timeoutMs) return { order: last, timedOut: true };
    options.onWait?.(elapsed);
    await options.sleep(options.intervalMs);
  }
}
