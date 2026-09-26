import { z } from "zod";

// Already written: the typed client for the ticketing API. Every answer is checked with Zod
// (Day 44): if the server ever sends something unexpected, you find out here, not deep in a component.
export const EventSchema = z.object({
  id: z.number(),
  title: z.string(),
  venue: z.string(),
  startsAt: z.string(),
  priceKes: z.number(),
  capacity: z.number(),
  available: z.number(),
  status: z.enum(["published", "cancelled"]),
  genre: z.string(),
  hue: z.number(),
});
export type TikitiEvent = z.infer<typeof EventSchema>;

export const OrderSchema = z.object({
  id: z.number(),
  eventId: z.number(),
  quantity: z.number(),
  amountKes: z.number(),
  status: z.enum(["pending", "paid", "cancelled", "failed", "expired"]),
  problem: z.string().nullable(),
  tickets: z.array(z.object({ id: z.number(), code: z.string() })),
});
export type Order = z.infer<typeof OrderSchema>;

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export interface Api {
  listEvents(): Promise<TikitiEvent[]>;
  getEvent(id: number): Promise<TikitiEvent>;
  placeOrder(input: { eventId: number; quantity: number; phone: string }): Promise<Order>;
  getOrder(id: number): Promise<Order>;
}

export function createApi(fetchFn: Fetcher = (url, init) => fetch(url, init)): Api {
  async function call<S extends z.ZodType>(schema: S, url: string, init?: RequestInit): Promise<z.output<S>> {
    const response = await fetchFn(url, init);
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = (body as { error?: string } | null)?.error ?? `The server answered ${response.status}`;
      throw new ApiError(response.status, message);
    }
    return schema.parse(body);
  }

  return {
    listEvents: async () => (await call(z.object({ events: z.array(EventSchema) }), "/api/events")).events,
    getEvent: (id) => call(EventSchema, `/api/events/${id}`),
    placeOrder: async ({ eventId, ...body }) =>
      (
        await call(z.object({ order: OrderSchema }), `/api/events/${eventId}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      ).order,
    getOrder: async (id) => (await call(z.object({ order: OrderSchema }), `/api/orders/${id}`)).order,
  };
}
