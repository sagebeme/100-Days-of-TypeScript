// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiProvider } from "./starter/ApiContext.tsx";
import { ApiError, type Api, type Order, type TikitiEvent } from "./starter/api.ts";
import { keys, eventsQuery, eventQuery, orderQuery, orderPollInterval, SEATS_POLL_MS, SEATS_FRESH_MS, ORDER_POLL_MS } from "./starter/queries.ts";
import { EventsPage } from "./starter/EventsPage.tsx";
import { EventPage } from "./starter/EventPage.tsx";
import { OrderPage } from "./starter/OrderPage.tsx";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const jazz: TikitiEvent = { id: 1, title: "Jioni Jazz Night", venue: "Uhuru Gardens", startsAt: "2026-12-12T18:00:00+03:00", priceKes: 2500, capacity: 500, available: 30, status: "published", genre: "jazz", hue: 265 };
const benga: TikitiEvent = { ...jazz, id: 2, title: "Benga Sundowner", available: 6, capacity: 300, hue: 150 };
const pending: Order = { id: 9, eventId: 1, quantity: 2, amountKes: 5000, status: "pending", problem: null, tickets: [] };
const paid: Order = { ...pending, status: "paid", tickets: [{ id: 1, code: "T1-ABCDEF0123456789" }, { id: 2, code: "T2-0123456789ABCDEF" }] };

function fakeApi(overrides: Partial<Api> = {}) {
  const api = {
    listEvents: vi.fn<Api["listEvents"]>(async () => [jazz, benga]),
    getEvent: vi.fn<Api["getEvent"]>(async (id) => (id === 1 ? jazz : benga)),
    placeOrder: vi.fn<Api["placeOrder"]>(async () => pending),
    getOrder: vi.fn<Api["getOrder"]>(async () => paid),
  };
  return { ...api, ...overrides } as typeof api;
}

function setup(ui: ReactNode, api: Api, queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ApiProvider api={api}>{ui}</ApiProvider>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe("queries", () => {
  it("keeps every key in one place, nested so one invalidation refreshes them all", () => {
    expect(keys.events).toEqual(["events"]);
    expect(keys.event(3)).toEqual(["events", 3]);
    expect(keys.order(7)).toEqual(["orders", 7]);
  });

  it("refreshes seat counts on a timer, and treats them as fresh for a while", () => {
    const api = fakeApi();
    expect(SEATS_POLL_MS).toBe(15_000);
    expect(SEATS_FRESH_MS).toBe(10_000);
    for (const options of [eventsQuery(api), eventQuery(api, 1)]) {
      expect(options.staleTime).toBe(SEATS_FRESH_MS);
      expect(options.refetchInterval).toBe(SEATS_POLL_MS);
    }
    expect(eventQuery(api, 1).queryKey).toEqual(["events", 1]);
    expect(orderQuery(api, 9).queryKey).toEqual(["orders", 9]);
  });

  it("asks about an order every 2 seconds while it's pending, and stops once it's settled", () => {
    expect(ORDER_POLL_MS).toBe(2_000);
    expect(orderPollInterval(undefined)).toBe(2_000);
    expect(orderPollInterval(pending)).toBe(2_000);
    for (const status of ["paid", "cancelled", "failed", "expired"] as const) expect(orderPollInterval({ ...pending, status })).toBe(false);
  });

  it("fetches with the api it's given", async () => {
    const api = fakeApi();
    const queryClient = new QueryClient();
    expect(await queryClient.fetchQuery(eventsQuery(api))).toEqual([jazz, benga]);
    expect(await queryClient.fetchQuery(orderQuery(api, 9))).toEqual(paid);
    expect(api.getOrder).toHaveBeenCalledWith(9);
  });
});

describe("EventsPage", () => {
  it("shows placeholders while loading, then the events", async () => {
    setup(<EventsPage />, fakeApi());
    expect(screen.getByRole("region", { name: "What's on" }).getAttribute("aria-busy")).toBe("true");
    expect(await screen.findByRole("article", { name: "Jioni Jazz Night" })).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.getByText("Only 6 left")).toBeTruthy();
    expect(screen.getByRole("region", { name: "What's on" }).getAttribute("aria-busy")).toBe("false");
  });

  it("explains a failure and offers to try again", async () => {
    let fail = true;
    const api = fakeApi({ listEvents: vi.fn(async () => (fail ? Promise.reject(new ApiError(503, "The server is busy.")) : [jazz])) });
    setup(<EventsPage />, api);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("The server is busy.");
    fail = false;
    await userEvent.click(within(alert).getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("article", { name: "Jioni Jazz Night" })).toBeTruthy();
  });

  it("keeps showing the events it has when a refresh fails", async () => {
    const api = fakeApi();
    const { queryClient } = setup(<EventsPage />, api);
    await screen.findByRole("article", { name: "Jioni Jazz Night" });
    api.listEvents.mockRejectedValue(new ApiError(503, "Busy"));
    await queryClient.refetchQueries({ queryKey: ["events"] });
    expect(screen.getAllByRole("article")).toHaveLength(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows new seat counts when they come in", async () => {
    const api = fakeApi();
    const { queryClient } = setup(<EventsPage />, api);
    await screen.findByText("Only 6 left");
    api.listEvents.mockResolvedValue([jazz, { ...benga, available: 2 }]);
    await queryClient.refetchQueries({ queryKey: ["events"] });
    expect(await screen.findByText("Only 2 left")).toBeTruthy();
  });

  it("opens instantly from the cache when you come back", async () => {
    const api = fakeApi();
    const first = setup(<EventsPage />, api);
    await screen.findByRole("article", { name: "Jioni Jazz Night" });
    first.unmount();
    setup(<EventsPage />, api, first.queryClient);
    expect(screen.getByRole("article", { name: "Jioni Jazz Night" })).toBeTruthy(); // no waiting
    expect(api.listEvents).toHaveBeenCalledTimes(1); // still fresh: not fetched again
  });
});

describe("buying on the EventPage", () => {
  async function ready(api: Api, onOrdered = vi.fn()) {
    const view = setup(<EventPage id={1} onOrdered={onOrdered} />, api);
    await screen.findByRole("heading", { name: "Jioni Jazz Night" });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Tickets" }), "2");
    await userEvent.type(screen.getByRole("textbox", { name: "M-Pesa phone number" }), "0712 345 678");
    return view;
  }

  it("takes the seats off the count the moment you buy, before the server answers", async () => {
    let answer!: (order: Order) => void;
    const api = fakeApi({ placeOrder: vi.fn(() => new Promise<Order>((resolve) => (answer = resolve))) });
    const onOrdered = vi.fn();
    const { queryClient } = await ready(api, onOrdered);
    expect(screen.getByText("Only 30 left")).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: "Buy with M-Pesa" }));
    expect(api.placeOrder).toHaveBeenCalledWith({ eventId: 1, quantity: 2, phone: "0712 345 678" });
    expect(await screen.findByText("Only 28 left")).toBeTruthy();
    expect(queryClient.getQueryData<TikitiEvent>(keys.event(1))?.available).toBe(28);
    expect((screen.getByRole("button", { name: /Sending the M-Pesa prompt/ }) as HTMLButtonElement).disabled).toBe(true);

    answer(pending);
    await waitFor(() => expect(onOrdered).toHaveBeenCalledWith(pending, expect.anything(), expect.anything(), expect.anything()));
    expect(queryClient.getQueryData(keys.order(9))).toEqual(pending); // the order page starts with it
    await waitFor(() => expect(api.getEvent).toHaveBeenCalledTimes(2)); // then checks the real number
  });

  it("puts the seats back and says why when the order fails", async () => {
    const api = fakeApi({ placeOrder: vi.fn(async () => Promise.reject(new ApiError(409, "Only 1 left"))) });
    const { queryClient } = await ready(api);
    api.getEvent.mockImplementation(() => new Promise(() => {})); // the refresh never lands: we see the rollback itself
    await userEvent.click(screen.getByRole("button", { name: "Buy with M-Pesa" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Only 1 left");
    expect(queryClient.getQueryData<TikitiEvent>(keys.event(1))?.available).toBe(30);
  });

  it("doesn't offer tickets that aren't there", async () => {
    setup(<EventPage id={2} onOrdered={() => {}} />, fakeApi());
    await screen.findByRole("heading", { name: "Benga Sundowner" });
    expect(within(screen.getByRole("combobox", { name: "Tickets" })).getAllByRole("option")).toHaveLength(6);
  });

  it("says so when it's sold out", async () => {
    setup(<EventPage id={1} onOrdered={() => {}} />, fakeApi({ getEvent: vi.fn(async () => ({ ...jazz, available: 0 })) }));
    expect(await screen.findByText(/Sold out\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Buy with M-Pesa" })).toBeNull();
  });
});

describe("OrderPage", () => {
  it("waits for the PIN, checking every 2 seconds, then shows the tickets and stops asking", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const getOrder = vi.fn().mockResolvedValueOnce(pending).mockResolvedValueOnce(pending).mockResolvedValue(paid);
    setup(<OrderPage id={9} />, fakeApi({ getOrder }));
    expect(await screen.findByRole("heading", { name: "Enter your M-Pesa PIN" })).toBeTruthy();

    await vi.advanceTimersByTimeAsync(2_000);
    expect(getOrder).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(await screen.findByRole("heading", { name: "You're in!" })).toBeTruthy();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["T1-ABCDEF0123456789", "T2-0123456789ABCDEF"]);

    const calls = getOrder.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10_000);
    expect(getOrder).toHaveBeenCalledTimes(calls);
  });

  it("explains a payment that didn't go through, and offers another go", async () => {
    setup(<OrderPage id={9} />, fakeApi({ getOrder: vi.fn(async () => ({ ...pending, status: "cancelled" as const, problem: "You cancelled the payment on your phone." })) }));
    expect(await screen.findByRole("heading", { name: "Payment didn't go through" })).toBeTruthy();
    expect(screen.getByText(/You cancelled the payment on your phone\./)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Try again" }).getAttribute("href")).toBe("#/events/1");
  });
});
