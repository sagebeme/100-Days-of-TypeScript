// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { makeCartReducer, emptyCart, summarise, MAX_SEATS, type CartState, type CartAction } from "./starter/cart.ts";
import { QuantityStepper } from "./starter/QuantityStepper.tsx";
import { TicketPicker } from "./starter/TicketPicker.tsx";
import { TIERS } from "./starter/data.ts";

afterEach(cleanup);

const [early, regular, vip, group] = TIERS;
const reducer = makeCartReducer(TIERS);
const run = (...actions: CartAction[]) => actions.reduce(reducer, emptyCart);
const add = (tier: (typeof TIERS)[number], times = 1): CartAction[] => Array.from({ length: times }, () => ({ type: "increment", tier }));

describe("the cart reducer", () => {
  it("adds and removes tickets, and forgets tiers that go back to 0", () => {
    expect(run(...add(regular, 3))).toEqual({ quantities: { regular: 3 }, message: null });
    expect(run(...add(regular, 2), { type: "decrement", tier: regular })).toEqual({ quantities: { regular: 1 }, message: null });
    expect(run(...add(vip), { type: "decrement", tier: vip })).toEqual({ quantities: {}, message: null });
    expect(run({ type: "decrement", tier: vip })).toEqual({ quantities: {}, message: null });
  });

  it("never changes the state it was given", () => {
    const before: CartState = Object.freeze({ quantities: Object.freeze({ regular: 1 }), message: null }) as CartState;
    const after = reducer(before, { type: "increment", tier: regular });
    expect(after).not.toBe(before);
    expect(after.quantities).not.toBe(before.quantities);
    expect(before.quantities).toEqual({ regular: 1 });
  });

  it("stops at each tier's limit per order, and says why", () => {
    const state = run(...add(vip, 5));
    expect(state).toEqual({ quantities: { vip: 4 }, message: "Up to 4 VIP per order" });
  });

  it("can't add a sold-out tier, or more than are left", () => {
    expect(run(...add(early))).toEqual({ quantities: {}, message: "Early bird is sold out" });
    const fewLeft = makeCartReducer([{ ...vip, available: 2 }]);
    const state = [...add({ ...vip, available: 2 }, 3)].reduce(fewLeft, emptyCart);
    expect(state).toEqual({ quantities: { vip: 2 }, message: "Only 2 VIP left" });
  });

  it("lets at most 10 people in per order, counting a group ticket as 4", () => {
    expect(MAX_SEATS).toBe(10);
    const state = run(...add(group, 2), ...add(regular, 3));
    expect(state).toEqual({ quantities: { group: 2, regular: 2 }, message: "Up to 10 people per order" });
    expect(run(...add(regular, 7), ...add(group))).toMatchObject({ quantities: { regular: 7 }, message: "Up to 10 people per order" });
  });

  it("clears a message once something works", () => {
    expect(run(...add(vip, 5), ...add(regular)).message).toBeNull();
  });

  it("sets a typed number, keeping it inside the limits", () => {
    expect(run({ type: "set", tier: regular, quantity: 6 })).toEqual({ quantities: { regular: 6 }, message: null });
    expect(run({ type: "set", tier: vip, quantity: 9 })).toEqual({ quantities: { vip: 4 }, message: "Up to 4 VIP per order" });
    expect(run(...add(group, 2), { type: "set", tier: regular, quantity: 5 })).toEqual({
      quantities: { group: 2, regular: 2 },
      message: "Up to 10 people per order",
    });
    for (const nonsense of [0, -3, 2.5, Number.NaN]) {
      expect(run(...add(regular, 2), { type: "set", tier: regular, quantity: nonsense }).quantities).toEqual({});
    }
  });

  it("empties the cart", () => {
    expect(run(...add(regular, 2), ...add(vip, 9), { type: "clear" })).toEqual(emptyCart);
  });
});

describe("summarise", () => {
  it("works out the lines, the people and the total from the state", () => {
    expect(summarise(run(...add(vip, 2), ...add(group)), TIERS)).toEqual({
      lines: [
        { tier: vip, quantity: 2, totalKes: 12000 },
        { tier: group, quantity: 1, totalKes: 8000 },
      ],
      seats: 6,
      totalKes: 20000,
    });
    expect(summarise(emptyCart, TIERS)).toEqual({ lines: [], seats: 0, totalKes: 0 });
  });
});

describe("QuantityStepper", () => {
  function setup(value = 2) {
    const handlers = { onIncrement: vi.fn(), onDecrement: vi.fn(), onSet: vi.fn() };
    render(<QuantityStepper label="VIP" value={value} {...handlers} />);
    return handlers;
  }

  it("is a labelled group with buttons that say what they do", async () => {
    const handlers = setup();
    const group = screen.getByRole("group", { name: "VIP tickets" });
    await userEvent.click(within(group).getByRole("button", { name: "Add one VIP" }));
    await userEvent.click(within(group).getByRole("button", { name: "Remove one VIP" }));
    expect(handlers.onIncrement).toHaveBeenCalledOnce();
    expect(handlers.onDecrement).toHaveBeenCalledOnce();
    expect((screen.getByRole("textbox", { name: "Number of VIP tickets" }) as HTMLInputElement).value).toBe("2");
  });

  it("can't go below 0", () => {
    setup(0);
    expect((screen.getByRole("button", { name: "Remove one VIP" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("sends a typed number once, on Enter or on leaving the box, not on every key", async () => {
    const handlers = setup(2);
    const box = screen.getByRole("textbox", { name: "Number of VIP tickets" });
    await userEvent.clear(box);
    await userEvent.type(box, "3");
    expect(handlers.onSet).not.toHaveBeenCalled();
    expect((box as HTMLInputElement).value).toBe("3");
    await userEvent.keyboard("{Enter}");
    expect(handlers.onSet).toHaveBeenLastCalledWith(3);

    await userEvent.clear(box);
    await userEvent.tab();
    expect(handlers.onSet).toHaveBeenLastCalledWith(0);
    expect(handlers.onSet).toHaveBeenCalledTimes(2);
  });

  it("ignores letters", async () => {
    setup(1);
    const box = screen.getByRole("textbox") as HTMLInputElement;
    await userEvent.type(box, "x2");
    expect(box.value).toBe("12");
  });
});

describe("TicketPicker", () => {
  const order = () => screen.getByRole("region", { name: "Your order" });

  it("updates the order as tickets are picked", async () => {
    render(<TicketPicker tiers={TIERS} onCheckout={() => {}} />);
    expect(within(order()).getByText(/pick your tickets/i)).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Add one VIP" }));
    await userEvent.click(screen.getByRole("button", { name: "Add one VIP" }));
    await userEvent.click(screen.getByRole("button", { name: "Add one Group of 4" }));

    const lines = within(order()).getAllByRole("listitem").map((li) => li.textContent);
    expect(lines).toEqual(["2 × VIPKES 12,000", "1 × Group of 4KES 8,000"]);
    expect(order().textContent).toContain("6 people");
    expect(order().textContent).toContain("KES 20,000");
  });

  it("shows sold-out tiers without a stepper", () => {
    render(<TicketPicker tiers={TIERS} onCheckout={() => {}} />);
    expect(screen.queryByRole("group", { name: "Early bird tickets" })).toBeNull();
    expect(screen.getByText("Sold out")).toBeTruthy();
  });

  it("announces why a ticket couldn't be added", async () => {
    render(<TicketPicker tiers={TIERS} onCheckout={() => {}} />);
    for (let i = 0; i < 5; i++) await userEvent.click(screen.getByRole("button", { name: "Add one VIP" }));
    expect(within(order()).getByRole("status").textContent).toBe("Up to 4 VIP per order");
  });

  it("checks out with the summary, and only when there's something to buy", async () => {
    const onCheckout = vi.fn();
    render(<TicketPicker tiers={TIERS} onCheckout={onCheckout} />);
    const checkout = within(order()).getByRole("button", { name: "Checkout" }) as HTMLButtonElement;
    expect(checkout.disabled).toBe(true);
    await userEvent.click(screen.getByRole("button", { name: "Add one Regular" }));
    await userEvent.click(checkout);
    expect(onCheckout).toHaveBeenCalledWith({ lines: [{ tier: regular, quantity: 1, totalKes: 2500 }], seats: 1, totalKes: 2500 });
  });

  it("clears the order", async () => {
    render(<TicketPicker tiers={TIERS} onCheckout={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Add one Regular" }));
    await userEvent.click(within(order()).getByRole("button", { name: "Clear" }));
    expect(within(order()).queryByRole("listitem")).toBeNull();
    expect((screen.getByRole("textbox", { name: "Number of Regular tickets" }) as HTMLInputElement).value).toBe("0");
  });
});
