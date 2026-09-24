import { describe, it, expect } from "vitest";
import { findItem } from "./starter/menu.ts";
import { orderTotal } from "./starter/receipt.ts";

describe("findItem", () => {
  it("finds an item on the menu", () => {
    expect(findItem("Chips Masala")).toEqual({ name: "Chips Masala", price: 200 });
  });

  it("returns undefined for something not on the menu", () => {
    expect(findItem("Pizza")).toBeUndefined();
  });
});

describe("orderTotal", () => {
  it("adds up the prices of the items ordered", () => {
    expect(orderTotal(["Chips Masala", "Soda"])).toBe(260);
  });

  it("counts an item twice if it is ordered twice", () => {
    expect(orderTotal(["Mandazi", "Mandazi", "Soda"])).toBe(100);
  });

  it("is 0 for an empty order", () => {
    expect(orderTotal([])).toBe(0);
  });

  it("throws for an item that is not on the menu", () => {
    expect(() => orderTotal(["Chips Masala", "Pizza"])).toThrow("Unknown item: Pizza");
  });
});
