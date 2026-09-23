import { describe, it, expect } from "vitest";
import { formatReceiptLine } from "./starter/receipt.ts";

describe("formatReceiptLine", () => {
  it("pads the name to 20 characters and shows the line total", () => {
    const line = formatReceiptLine({ name: "Smokie Pasua", price: 50, quantity: 2 });
    expect(line).toBe(`${"Smokie Pasua".padEnd(20)}KES 100`);
  });

  it("handles a single item", () => {
    const line = formatReceiptLine({ name: "Mutura", price: 40, quantity: 1 });
    expect(line).toBe(`${"Mutura".padEnd(20)}KES 40`);
  });

  it("handles a name already 20 characters or longer without truncating it", () => {
    const longName = "Mahindi Choma Combo!";
    const line = formatReceiptLine({ name: longName, price: 30, quantity: 3 });
    expect(line).toBe(`${longName}KES 90`);
  });
});
