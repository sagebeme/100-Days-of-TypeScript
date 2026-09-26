import type { Order } from "./api.ts";

export interface WaitOptions {
  intervalMs: number;
  timeoutMs: number;
  sleep(ms: number): Promise<void>;
  now(): number;
  onWait?(elapsedMs: number): void; // for a "Waiting for M-Pesa… 12s" line
}

export const MAX_BLIPS = 3;

// Ask about the order until it isn't "pending", or until the time's up. An Unreachable error (a
// network blip) is fine; MAX_BLIPS in a row isn't. Any other error stops at once. The tests are the spec.
export async function waitForOrder(getOrder: () => Promise<Order>, options: WaitOptions): Promise<{ order: Order | null; timedOut: boolean }> {
  throw new Error(`TODO: waitForOrder(${typeof getOrder}, every ${options.intervalMs}ms)`);
}
