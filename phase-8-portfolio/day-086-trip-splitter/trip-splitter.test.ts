import { describe, it, expect } from "vitest";
import { divide, owed, balances, settleUp, summary, formatKes, type Expense } from "./starter/split.ts";

const people = ["Amina", "Baraka", "Chege", "Wanjiru"];
const equal = (id: string, paidBy: string, amount: number, between = people): Expense => ({ id, description: id, paidBy, amount, split: { kind: "equal", between } });

describe("dividing money", () => {
  it("always adds back up to the exact total, in whole shillings", () => {
    expect(divide(1000, { A: 1, B: 1, C: 1 })).toEqual({ A: 334, B: 333, C: 333 });
    expect(divide(10, { A: 1, B: 1, C: 1, D: 1 })).toEqual({ A: 3, B: 3, C: 2, D: 2 });
    for (const total of [1, 7, 99, 1001, 24_000]) {
      const parts = divide(total, { A: 3, B: 1, C: 2 });
      expect(Object.values(parts).reduce((s, v) => s + v, 0)).toBe(total);
      expect(Object.values(parts).every(Number.isInteger)).toBe(true);
    }
  });

  it("gives the leftover shillings to the biggest fractions", () => {
    expect(divide(100, { A: 2, B: 1 })).toEqual({ A: 67, B: 33 }); // 66.67 and 33.33
  });

  it("needs somebody to split it between", () => {
    expect(() => divide(100, {})).toThrow(/Nobody/);
    expect(() => divide(100, { A: 0 })).toThrow(/Nobody/);
  });
});

describe("what each person owes", () => {
  it("splits equally, by shares, or by exact amounts", () => {
    expect(owed(equal("Fuel", "Baraka", 6500))).toEqual({ Amina: 1625, Baraka: 1625, Chege: 1625, Wanjiru: 1625 });
    expect(owed({ id: "d", description: "Dinner", paidBy: "Chege", amount: 9200, split: { kind: "shares", shares: { Amina: 1, Baraka: 1, Chege: 2, Wanjiru: 1 } } })).toEqual({
      Amina: 1840,
      Baraka: 1840,
      Chege: 3680,
      Wanjiru: 1840,
    });
    expect(owed({ id: "b", description: "Boat", paidBy: "Wanjiru", amount: 3000, split: { kind: "exact", amounts: { Amina: 1500, Baraka: 1500 } } })).toEqual({ Amina: 1500, Baraka: 1500 });
  });

  it("refuses exact amounts that don't add up, and amounts that aren't whole shillings above 0", () => {
    expect(() => owed({ id: "b", description: "Boat", paidBy: "Wanjiru", amount: 3000, split: { kind: "exact", amounts: { Amina: 1000 } } })).toThrow(/Boat.*1000.*3000/);
    expect(() => owed(equal("Tip", "Amina", 99.5))).toThrow(/whole shillings/);
    expect(() => owed(equal("Nothing", "Amina", 0))).toThrow(/whole shillings/);
  });
});

describe("balances", () => {
  it("are what you paid minus what you owe, and always add up to 0", () => {
    const b = balances(people, [equal("Airbnb", "Amina", 24000), equal("Fuel", "Baraka", 6500)]);
    expect(b).toEqual({ Amina: 24000 - 6000 - 1625, Baraka: 6500 - 6000 - 1625, Chege: -7625, Wanjiru: -7625 });
    expect(Object.values(b).reduce((s, v) => s + v, 0)).toBe(0);
  });

  it("refuses someone who isn't on the trip", () => {
    expect(() => balances(people, [equal("Snacks", "Otieno", 500)])).toThrow(/Otieno isn't on this trip/);
  });
});

describe("settling up", () => {
  it("sends money from those who owe to those who are owed, until everyone's square", () => {
    const b = balances(people, [equal("Airbnb", "Amina", 24000), equal("Fuel", "Baraka", 6500)]);
    const transfers = settleUp(b);
    const after = { ...b };
    for (const t of transfers) {
      expect(t.amount).toBeGreaterThan(0);
      after[t.from] += t.amount;
      after[t.to] -= t.amount;
    }
    expect(Object.values(after).every((v) => v === 0)).toBe(true);
  });

  it("uses fewer sends than people", () => {
    const b = { A: 300, B: -100, C: -100, D: -100 };
    expect(settleUp(b)).toEqual([
      { from: "B", to: "A", amount: 100 },
      { from: "C", to: "A", amount: 100 },
      { from: "D", to: "A", amount: 100 },
    ]);
    expect(settleUp({ A: 500, B: -500, C: 200, D: -200 })).toHaveLength(2);
  });

  it("has nothing to send when everyone's square", () => {
    expect(settleUp({ A: 0, B: 0 })).toEqual([]);
  });
});

describe("the group chat message", () => {
  it("says what was spent and who sends what", () => {
    const text = summary("Diani weekend", ["Amina", "Baraka"], [equal("Airbnb", "Amina", 24000, ["Amina", "Baraka"])]);
    expect(text).toBe("*Diani weekend*\nSpent: KES 24,000 (KES 12,000 each on average)\n\nTo settle up on M-Pesa:\n• Baraka → Amina: KES 12,000");
    expect(summary("Nothing yet", ["Amina"], [])).toContain("Everyone's square.");
    expect(formatKes(1234567)).toBe("KES 1,234,567");
  });
});
