import { describe, it, expect } from "vitest";
import {
  checkout,
  parseQuantity,
  describeError,
  SoldOutError,
  InvalidPromoError,
  type TicketEvent,
} from "./starter/checkout.ts";

const sol: TicketEvent = { name: "Sol Fest", priceKes: 1000, remaining: 5 };

describe("custom errors", () => {
  it("SoldOutError is an Error with a name, message and eventName", () => {
    const error = new SoldOutError("Sol Fest");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("SoldOutError");
    expect(error.message).toBe("Sol Fest is sold out");
    expect(error.eventName).toBe("Sol Fest");
  });

  it("InvalidPromoError is an Error with a name, message and code", () => {
    const error = new InvalidPromoError("BOGUS");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("InvalidPromoError");
    expect(error.message).toBe("Promo code BOGUS is not valid");
    expect(error.code).toBe("BOGUS");
  });
});

describe("checkout", () => {
  it("prices an order at full price with no promo code", () => {
    expect(checkout(sol, 2)).toEqual({ ok: true, value: { eventName: "Sol Fest", quantity: 2, total: 2000 } });
  });

  it("applies NAIROBI10 for 10% off", () => {
    const result = checkout(sol, 2, "NAIROBI10");
    expect(result.ok && result.value.total).toBe(1800);
  });

  it("ignores the case of a promo code", () => {
    const result = checkout(sol, 2, "student20");
    expect(result.ok && result.value.total).toBe(1600);
  });

  it("rounds to a whole shilling", () => {
    const result = checkout({ name: "Small Gig", priceKes: 333, remaining: 10 }, 1, "NAIROBI10");
    expect(result.ok && result.value.total).toBe(300);
  });

  it("returns a SoldOutError instead of throwing when there aren't enough tickets", () => {
    const result = checkout(sol, 6);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBeInstanceOf(SoldOutError);
  });

  it("lets you buy exactly what is left", () => {
    expect(checkout(sol, 5).ok).toBe(true);
  });

  it("returns an InvalidPromoError for an unknown code", () => {
    const result = checkout(sol, 1, "BOGUS");
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toBeInstanceOf(InvalidPromoError);
    expect(!result.ok && result.error.message).toBe("Promo code BOGUS is not valid");
  });

  it("checks stock before the promo code", () => {
    const result = checkout(sol, 6, "BOGUS");
    expect(!result.ok && result.error).toBeInstanceOf(SoldOutError);
  });
});

describe("parseQuantity", () => {
  it("accepts a positive whole number", () => {
    expect(parseQuantity(2)).toBe(2);
  });

  it("accepts a string that holds a positive whole number", () => {
    expect(parseQuantity("3")).toBe(3);
  });

  it.each([0, -1, 1.5, "abc", "", null, undefined, {}])("rejects %s", (bad) => {
    expect(() => parseQuantity(bad)).toThrow(TypeError);
    expect(() => parseQuantity(bad)).toThrow("Invalid quantity");
  });
});

describe("describeError", () => {
  it("describes a sold out error", () => {
    expect(describeError(new SoldOutError("Sol Fest"))).toBe("Sorry, Sol Fest is sold out");
  });

  it("describes an invalid promo error", () => {
    expect(describeError(new InvalidPromoError("BOGUS"))).toBe("The code BOGUS is not valid");
  });

  it("uses the message of any other Error", () => {
    expect(describeError(new Error("Network down"))).toBe("Network down");
  });

  it("copes with something that isn't an Error at all", () => {
    expect(describeError("oops")).toBe("Something went wrong");
    expect(describeError(undefined)).toBe("Something went wrong");
  });

  it("works on whatever a catch block hands you", () => {
    let caught: unknown;
    try {
      parseQuantity("banana");
    } catch (error) {
      caught = error;
    }
    expect(describeError(caught)).toBe("Invalid quantity: banana");
  });
});
