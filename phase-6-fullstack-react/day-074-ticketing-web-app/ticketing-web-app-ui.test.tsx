// @vitest-environment happy-dom
import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";

// The browser components, against a pretend API. (A browser never lets scripts see cookies, and
// happy-dom behaves the same, so the real API is tested in ticketing-web-app.test.ts instead.)
const nav = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", async (original) => ({ ...(await original<object>()), useRouter: () => nav }));

import { BuyForm } from "./starter/app/events/[id]/BuyForm.tsx";
import { OrderStatus, ORDER_POLL_MS } from "./starter/app/orders/[id]/OrderStatus.tsx";
import { CheckIn } from "./starter/app/events/[id]/check-in/CheckIn.tsx";
import type { OrderView } from "./starter/server/queries.ts";

type Answer = { status: number; body: unknown };
// fetch answers from a list of [method path, answer]; a path answered more than once takes turns.
function fakeApi(routes: Record<string, Answer | Answer[]>) {
  const fetchFn = vi.fn(async (url: string, init: RequestInit = {}) => {
    const key = `${init.method ?? "GET"} ${url}`;
    const entry = routes[key];
    if (!entry) throw new Error(`The pretend API doesn't know ${key}`);
    const answer = Array.isArray(entry) ? (entry.length > 1 ? entry.shift()! : entry[0]) : entry;
    return new Response(JSON.stringify(answer.body), { status: answer.status, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fetchFn);
  return fetchFn;
}

const pending: OrderView = { id: 7, eventId: 2, eventTitle: "Gengetone Block Party", quantity: 2, amountKes: 1600, status: "pending", problem: null, tickets: [] };
const paidTickets = [
  { id: 1, code: "T1-3419C1CF5A2891AA", checkedInAt: null },
  { id: 2, code: "T2-055C33999142F9B6", checkedInAt: null },
];

beforeEach(() => {
  nav.push.mockReset();
  nav.refresh.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("BuyForm", () => {
  const fill = async () => {
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Tickets" }), "2");
    await userEvent.type(screen.getByRole("textbox", { name: "M-Pesa phone number" }), "0712 345 678");
    await userEvent.click(screen.getByRole("button", { name: "Pay KES 1,600 with M-Pesa" }));
  };

  it("sends people who aren't logged in to log in, and back here after", () => {
    render(<BuyForm eventId={2} priceKes={800} available={40} signedIn={false} />);
    expect(screen.getByRole("link", { name: "Log in to buy" }).getAttribute("href")).toBe("/login?next=/events/2");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("places the order through the API and opens it", async () => {
    const fetchFn = fakeApi({ "POST /api/events/2/orders": { status: 201, body: { order: { ...pending } } } });
    render(<BuyForm eventId={2} priceKes={800} available={40} signedIn />);
    await fill();
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/orders/7"));
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ quantity: 2, phone: "0712 345 678" });
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true); // no second order while the page changes
  });

  it("offers only the seats that are left, and at most 10", () => {
    render(<BuyForm eventId={2} priceKes={800} available={3} signedIn />);
    expect(screen.getAllByRole("option")).toHaveLength(3);
    cleanup();
    render(<BuyForm eventId={2} priceKes={800} available={400} signedIn />);
    expect(screen.getAllByRole("option")).toHaveLength(10);
  });

  it("says what went wrong, in the API's words, and lets them try again", async () => {
    fakeApi({ "POST /api/events/2/orders": { status: 409, body: { error: "Only 1 left" } } });
    render(<BuyForm eventId={2} priceKes={800} available={40} signedIn />);
    await fill();
    expect((await screen.findByRole("alert")).textContent).toBe("Only 1 left");
    expect(nav.push).not.toHaveBeenCalled();
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
  });

  it("sends someone whose session ran out to log in again", async () => {
    fakeApi({ "POST /api/events/2/orders": { status: 401, body: { error: "Log in first" } } });
    render(<BuyForm eventId={2} priceKes={800} available={40} signedIn />);
    await fill();
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith("/login?next=/events/2"));
  });

  it("copes with no connection", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    render(<BuyForm eventId={2} priceKes={800} available={40} signedIn />);
    await fill();
    expect((await screen.findByRole("alert")).textContent).toMatch(/offline\. No money was taken/);
  });
});

describe("OrderStatus", () => {
  it("waits for the PIN, then shows the tickets, and stops asking", async () => {
    const fetchFn = fakeApi({
      "GET /api/orders/7": [
        { status: 200, body: { order: { ...pending } } },
        { status: 200, body: { order: { ...pending, status: "paid", tickets: paidTickets } } },
      ],
    });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<OrderStatus initial={pending} sandbox={false} />);
    expect(screen.getByRole("heading", { name: "Enter your M-Pesa PIN" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "M-Pesa sandbox" })).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled(); // it starts with what the server rendered

    await act(() => vi.advanceTimersByTimeAsync(ORDER_POLL_MS));
    expect(screen.getByRole("heading", { name: "Enter your M-Pesa PIN" })).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(ORDER_POLL_MS));
    expect(await screen.findByRole("heading", { name: "You're in!" })).toBeTruthy();
    expect(screen.getByText(/Gengetone Block Party/)).toBeTruthy(); // kept from the page: the API doesn't send it
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(paidTickets.map((t) => t.code));

    const calls = fetchFn.mock.calls.length;
    await act(() => vi.advanceTimersByTimeAsync(ORDER_POLL_MS * 5));
    expect(fetchFn.mock.calls.length).toBe(calls);
  });

  it("offers the sandbox buttons in development, and shows what they did at once", async () => {
    fakeApi({
      "POST /api/dev/orders/7/settle": { status: 200, body: { result: "not-paid" } },
      "GET /api/orders/7": { status: 200, body: { order: { ...pending, status: "cancelled", problem: "You cancelled the payment on your phone." } } },
    });
    render(<OrderStatus initial={pending} sandbox />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel on the phone" }));
    expect(await screen.findByRole("heading", { name: "Payment didn't go through" })).toBeTruthy();
    expect(screen.getByText(/You cancelled the payment on your phone\./)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Try again" }).getAttribute("href")).toBe("/events/2");
  });

  it("shows an order that's already settled without asking about it", () => {
    const fetchFn = fakeApi({});
    render(<OrderStatus initial={{ ...pending, status: "paid", tickets: paidTickets }} sandbox />);
    expect(screen.getByRole("heading", { name: "You're in!" })).toBeTruthy();
    expect(screen.queryByRole("group", { name: "M-Pesa sandbox" })).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe("CheckIn", () => {
  it("lets a ticket in, says so loudly, and gets ready for the next one", async () => {
    fakeApi({
      "POST /api/events/2/check-in": [
        { status: 200, body: { admitted: true, ticketId: 1, holder: "Amina Otieno" } },
        { status: 409, body: { error: "Already used: this ticket got in at 19:02." } },
      ],
    });
    render(<CheckIn eventId={2} sold={2} alreadyIn={0} />);
    const box = screen.getByRole("textbox", { name: "Ticket code" }) as HTMLInputElement;
    expect(document.activeElement).toBe(box); // ready to scan straight away

    await userEvent.type(box, "T1-3419C1CF5A2891AA{Enter}");
    expect((await screen.findByRole("alert")).textContent).toBe("✓Let them in: Amina Otieno");
    expect(screen.getByText(/of 2 in/).textContent).toBe("1 of 2 in");
    expect(box.value).toBe("");
    expect(document.activeElement).toBe(box);

    await userEvent.type(box, "T1-3419C1CF5A2891AA{Enter}");
    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("✕Don't let them in. Already used: this ticket got in at 19:02."));
    expect(screen.getByText(/of 2 in/).textContent).toBe("1 of 2 in");
    expect(screen.getByRole("list").textContent).toContain("Let them in: Amina Otieno"); // the earlier scan
  });

  it("ignores an empty scan, and says so when there's no connection", async () => {
    const fetchFn = fakeApi({});
    render(<CheckIn eventId={2} sold={0} alreadyIn={3} />);
    expect(screen.getByText(/of 0 in/).textContent).toBe("3 of 0 in");
    await userEvent.type(screen.getByRole("textbox"), "   {Enter}");
    expect(fetchFn).not.toHaveBeenCalled();
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    await userEvent.type(screen.getByRole("textbox"), "T1-X{Enter}");
    expect((await screen.findByRole("alert")).textContent).toMatch(/No connection/);
  });
});
