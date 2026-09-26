import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "./ApiContext.tsx";
import type { Api, Order, TikitiEvent } from "./api.ts";

// Every cache key in one place. Keys are arrays, and they nest: invalidating ["events"] also
// refreshes ["events", 3]. A typo'd key would silently be a different cache entry, so no key is
// ever written out by hand anywhere else.
export const keys = {
  events: ["events"] as const,
  event: (id: number) => ["events", id] as const,
  order: (id: number) => ["orders", id] as const,
};

// Other fans are buying too. Seat counts are refreshed every 15 seconds while the page is open,
// and count as fresh for 10: moving between pages inside that time doesn't refetch.
export const SEATS_POLL_MS = 15_000;
export const SEATS_FRESH_MS = 10_000;
// While we wait for the fan to type their M-Pesa PIN, ask about the order every 2 seconds.
export const ORDER_POLL_MS = 2_000;

export function eventsQuery(api: Api) {
  return queryOptions({
    queryKey: keys.events,
    queryFn: () => api.listEvents(),
    staleTime: SEATS_FRESH_MS,
    refetchInterval: SEATS_POLL_MS,
  });
}

export function eventQuery(api: Api, id: number) {
  return queryOptions({
    queryKey: keys.event(id),
    queryFn: () => api.getEvent(id),
    staleTime: SEATS_FRESH_MS,
    refetchInterval: SEATS_POLL_MS,
  });
}

// Keep asking while it's pending; stop the moment it's settled, one way or the other.
export function orderPollInterval(order: Order | undefined): number | false {
  return order === undefined || order.status === "pending" ? ORDER_POLL_MS : false;
}

export function orderQuery(api: Api, id: number) {
  return queryOptions({
    queryKey: keys.order(id),
    queryFn: () => api.getOrder(id),
    refetchInterval: (query) => orderPollInterval(query.state.data),
  });
}

// Buying: the seat count drops the moment the fan presses Buy (optimistic), is put back if the
// order fails, and is refreshed from the server either way.
export function usePlaceOrder(eventId: number) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { quantity: number; phone: string }) => api.placeOrder({ eventId, ...input }),
    onMutate: async ({ quantity }) => {
      // A poll that lands now would overwrite our optimistic number with an older one.
      await queryClient.cancelQueries({ queryKey: keys.event(eventId) });
      const before = queryClient.getQueryData<TikitiEvent>(keys.event(eventId));
      if (before) queryClient.setQueryData<TikitiEvent>(keys.event(eventId), { ...before, available: Math.max(0, before.available - quantity) });
      return { before };
    },
    onError: (_error, _input, context) => {
      if (context?.before) queryClient.setQueryData(keys.event(eventId), context.before);
    },
    onSuccess: (order) => {
      // We already know the order: the order page starts with it instead of loading it again.
      queryClient.setQueryData(keys.order(order.id), order);
    },
    // Refresh every seat count, without waiting for it. Returning this promise would keep the
    // mutation "pending" (the button saying "Sending…", the error hidden) until the refresh lands.
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: keys.events });
    },
  });
}
