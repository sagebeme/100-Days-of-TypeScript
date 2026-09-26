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

export async function createOrder(request: OrderRequest, fetchFn: Fetcher = fetch): Promise<OrderResult> {
  let response: Response;
  try {
    response = await fetchFn("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    return { ok: false, kind: "unavailable", message: "You seem to be offline. Check your connection and try again." };
  }
  const body = (await response.json().catch(() => ({}))) as { order?: PlacedOrder; errors?: Record<string, string>; error?: string };

  if (response.status === 201 && body.order) return { ok: true, order: body.order };
  if (response.status === 422 && body.errors) return { ok: false, kind: "invalid", fields: body.errors };
  if (response.status === 409) return { ok: false, kind: "sold-out", message: body.error ?? "Those tickets have just sold out." };
  return { ok: false, kind: "unavailable", message: body.error ?? TRY_AGAIN };
}
