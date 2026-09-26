// Already written: a small client for the Day 66 ticketing API.

export interface EventSummary {
  id: number;
  title: string;
  venue: string;
  startsAt: string;
  priceKes: number;
  available: number;
}

export interface Order {
  id: number;
  eventId: number;
  quantity: number;
  amountKes: number;
  status: "pending" | "paid" | "cancelled" | "failed" | "expired";
  holdExpiresAt: string;
  receipt: string | null;
  problem: string | null;
  tickets: { id: number; code: string; checkedInAt: string | null }[];
}

// The API answered, but with an error: its status and its message ("Sold out").
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// The API didn't answer at all.
export class Unreachable extends Error {}

export type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function tikitiClient(baseUrl: string, fetchFn: Fetch, cookie?: string) {
  async function request<T>(method: string, path: string, body?: unknown): Promise<{ body: T; setCookie: string | null }> {
    let response: Response;
    try {
      response = await fetchFn(new URL(path, baseUrl), {
        method,
        headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      throw new Unreachable(`Can't reach Tikiti at ${baseUrl}. Is it running?`, { cause: error });
    }
    const json = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new ApiError(response.status, json.error ?? `Tikiti answered ${response.status}`);
    return { body: json as T, setCookie: response.headers.get("set-cookie") };
  }

  return {
    login: (email: string, password: string) => request<{ user: { name: string; email: string } }>("POST", "/login", { email, password }),
    logout: () => request<unknown>("POST", "/logout"),
    events: async () => (await request<{ events: EventSummary[] }>("GET", "/events")).body.events,
    buy: async (eventId: number, quantity: number, phone: string) =>
      (await request<{ order: Order; message: string }>("POST", `/events/${eventId}/orders`, { quantity, phone })).body,
    order: async (id: number) => (await request<{ order: Order }>("GET", `/orders/${id}`)).body.order,
  };
}
