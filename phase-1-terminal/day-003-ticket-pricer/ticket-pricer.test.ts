import { describe, it, expect } from "vitest";
import { priceTicket } from "./starter/ticket-pricer.ts";

describe("priceTicket", () => {
  it("discounts early-bird tickets to 80% of base price", () => {
    expect(priceTicket("early-bird", 1000)).toBe(800);
  });

  it("discounts student tickets to 50% of base price", () => {
    expect(priceTicket("student", 1000)).toBe(500);
  });

  it("charges VIP tickets 150% of base price", () => {
    expect(priceTicket("vip", 1000)).toBe(1500);
  });

  it("scales with a different base price", () => {
    expect(priceTicket("student", 2000)).toBe(1000);
  });
});
