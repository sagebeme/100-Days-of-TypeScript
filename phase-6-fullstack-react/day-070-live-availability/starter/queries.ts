import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./ApiContext.tsx";
import type { Api, Order } from "./api.ts";

// Every cache key in one place. Keys are arrays, and they nest: invalidating ["events"] also
// refreshes ["events", 3]. A typo'd key would silently be a different cache entry, so no key is
// ever written out by hand anywhere else.
// TODO: event(id) -> ["events", id], order(id) -> ["orders", id]
export const keys = {
  events: ["events"] as const,
  event: (id: number) => ["TODO", id] as const,
  order: (id: number) => ["TODO", id] as const,
};

// Other fans are buying too. Seat counts are refreshed every 15 seconds while the page is open,
// and count as fresh for 10: moving between pages inside that time doesn't refetch.
export const SEATS_POLL_MS = 15_000;
export const SEATS_FRESH_MS = 10_000;
// While we wait for the fan to type their M-Pesa PIN, ask about the order every 2 seconds.
export const ORDER_POLL_MS = 2_000;

// TODO: queryOptions({ queryKey, queryFn: () => api.listEvents(), staleTime: SEATS_FRESH_MS, refetchInterval: SEATS_POLL_MS })
export function eventsQuery(api: Api) {
  return queryOptions({ queryKey: keys.events, queryFn: () => api.listEvents() });
}

// TODO: the same, for one event: keys.event(id) and api.getEvent(id).
export function eventQuery(api: Api, id: number) {
  return queryOptions({ queryKey: keys.event(id), queryFn: () => api.getEvent(id) });
}

// TODO: ORDER_POLL_MS while the order is pending (or not loaded yet); false (stop) once it's settled.
export function orderPollInterval(order: Order | undefined): number | false {
  void order;
  return false;
}

// TODO: add refetchInterval: (query) => orderPollInterval(query.state.data)
export function orderQuery(api: Api, id: number) {
  return queryOptions({ queryKey: keys.order(id), queryFn: () => api.getOrder(id) });
}

// TODO: buying. useMutation({
//   mutationFn: ({ quantity, phone }) => api.placeOrder({ eventId, quantity, phone }),
//   onMutate: cancel queries for this event (a poll landing now would overwrite our number), remember
//     the event as it was, set its `available` to `quantity` fewer (never below 0), and return { before }.
//   onError: put `before` back.
//   onSuccess: put the order in the cache under keys.order(order.id), so the order page starts with it.
//   onSettled: invalidate keys.events, WITHOUT returning the promise. (Returning it keeps the mutation
//     "pending" until the refresh lands: the button stays on "Sending…" and errors wait.)
// })
export function usePlaceOrder(eventId: number) {
  const api = useApi();
  const queryClient = useQueryClient();
  void queryClient;
  return useMutation({
    mutationFn: (input: { quantity: number; phone: string }) => api.placeOrder({ eventId, ...input }),
  });
}

