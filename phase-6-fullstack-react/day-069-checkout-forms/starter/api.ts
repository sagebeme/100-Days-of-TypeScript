import type { OrderRequest } from "./schemas.ts";

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface PlacedOrder {
  id: number;
  totalKes: number;
  phone: string;
}

// Every way an order can go, as a type. The form handles each one; nothing is left to a catch-all.
export type OrderResult =
  | { ok: true; order: PlacedOrder }
  | { ok: false; kind: "invalid"; fields: Record<string, string> } // 422: show them on the fields
  | { ok: false; kind: "sold-out"; message: string } // 409: nothing the fan typed will fix it
  | { ok: false; kind: "unavailable"; message: string }; // 502, 5xx, offline: try again

const TRY_AGAIN = "We couldn't reach M-Pesa. No money was taken. Try again in a minute.";

// TODO: POST the request as JSON to /api/orders, and turn the answer into an OrderResult:
// - 201 with { order }: { ok: true, order }
// - 422 with { errors }: { ok: false, kind: "invalid", fields: errors }
// - 409: { ok: false, kind: "sold-out", message: the body's error, or "Those tickets have just sold out." }
// - anything else, or a body that isn't JSON: "unavailable", with the body's error or TRY_AGAIN
// - fetch itself throws (offline): "unavailable", "You seem to be offline. Check your connection and try again."
export async function createOrder(request: OrderRequest, fetchFn: Fetcher = fetch): Promise<OrderResult> {
  void [request, fetchFn, TRY_AGAIN];
  return { ok: false, kind: "unavailable", message: "TODO: createOrder" };
}
