// Splitting a trip's costs. Money is whole shillings, never floats: 1000 ÷ 3 is 334 + 333 + 333,
// and every split adds back up to exactly what was paid.

export type Split =
  | { kind: "equal"; between: string[] }
  | { kind: "exact"; amounts: Record<string, number> } // each person's part, in KES
  | { kind: "shares"; shares: Record<string, number> }; // e.g. a couple is 2 shares

export interface Expense {
  id: string;
  description: string;
  paidBy: string;
  amount: number; // KES, a whole number above 0
  split: Split;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

// Share `total` in proportion to `weights`, in whole shillings, adding up exactly. The shillings left
// over after rounding down go one each to the biggest fractions (ties: in the order given).
export function divide(total: number, weights: Record<string, number>): Record<string, number> {
  const people = Object.keys(weights).filter((p) => weights[p] > 0);
  const sum = people.reduce((s, p) => s + weights[p], 0);
  if (people.length === 0 || sum <= 0) throw new Error("Nobody to split it between");
  const exact = people.map((p) => ({ p, value: (total * weights[p]) / sum }));
  const result: Record<string, number> = Object.fromEntries(exact.map(({ p, value }) => [p, Math.floor(value)]));
  let left = total - Object.values(result).reduce((s, v) => s + v, 0);
  const byFraction = [...exact].sort((a, b) => b.value - Math.floor(b.value) - (a.value - Math.floor(a.value)));
  for (const { p } of byFraction) {
    if (left === 0) break;
    result[p]++;
    left--;
  }
  return result;
}

// What each person owes for one expense.
export function owed(expense: Expense): Record<string, number> {
  if (!Number.isInteger(expense.amount) || expense.amount <= 0) throw new Error(`${expense.description}: the amount must be whole shillings above 0`);
  const { split } = expense;
  if (split.kind === "equal") return divide(expense.amount, Object.fromEntries(split.between.map((p) => [p, 1])));
  if (split.kind === "shares") return divide(expense.amount, split.shares);
  const sum = Object.values(split.amounts).reduce((s, v) => s + v, 0);
  if (sum !== expense.amount) throw new Error(`${expense.description}: the parts add up to ${sum}, not ${expense.amount}`);
  return { ...split.amounts };
}

// Each person's balance: what they paid minus what they owe. Positive: they're owed money.
// Everyone's balances always add up to 0.
export function balances(people: string[], expenses: Expense[]): Record<string, number> {
  const balance: Record<string, number> = Object.fromEntries(people.map((p) => [p, 0]));
  for (const expense of expenses) {
    for (const person of [expense.paidBy, ...Object.keys(owed(expense))]) {
      if (!(person in balance)) throw new Error(`${person} isn't on this trip`);
    }
    balance[expense.paidBy] += expense.amount;
    for (const [person, amount] of Object.entries(owed(expense))) balance[person] -= amount;
  }
  return balance;
}

// Who sends what to whom so everyone's square. Repeatedly the person who owes most pays the person
// owed most, as much as possible: never more than people - 1 sends, and usually fewer.
export function settleUp(balance: Record<string, number>): Transfer[] {
  const debtors = Object.entries(balance).filter(([, b]) => b < 0).map(([person, b]) => ({ person, amount: -b }));
  const creditors = Object.entries(balance).filter(([, b]) => b > 0).map(([person, b]) => ({ person, amount: b }));
  const transfers: Transfer[] = [];
  const biggest = (list: { person: string; amount: number }[]) => list.sort((a, b) => b.amount - a.amount || a.person.localeCompare(b.person))[0];
  while (debtors.some((d) => d.amount > 0) && creditors.some((c) => c.amount > 0)) {
    const debtor = biggest(debtors.filter((d) => d.amount > 0));
    const creditor = biggest(creditors.filter((c) => c.amount > 0));
    const amount = Math.min(debtor.amount, creditor.amount);
    transfers.push({ from: debtor.person, to: creditor.person, amount });
    debtor.amount -= amount;
    creditor.amount -= amount;
  }
  return transfers;
}

export const formatKes = (amount: number) => `KES ${new Intl.NumberFormat("en-KE").format(amount)}`;

// A message for the group chat.
export function summary(tripName: string, people: string[], expenses: Expense[]): string {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const transfers = settleUp(balances(people, expenses));
  const lines = [`*${tripName}*`, `Spent: ${formatKes(total)} (${formatKes(Math.round(total / Math.max(people.length, 1)))} each on average)`, ""];
  if (transfers.length === 0) lines.push("Everyone's square. 🎉");
  else {
    lines.push("To settle up on M-Pesa:");
    for (const t of transfers) lines.push(`• ${t.from} → ${t.to}: ${formatKes(t.amount)}`);
  }
  return lines.join("\n");
}
