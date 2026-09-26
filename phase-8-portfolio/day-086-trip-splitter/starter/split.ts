// Splitting a trip's costs, in whole shillings. The tests are the spec.
export type Split =
  | { kind: "equal"; between: string[] }
  | { kind: "exact"; amounts: Record<string, number> }
  | { kind: "shares"; shares: Record<string, number> };

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

export const formatKes = (amount: number) => `KES ${new Intl.NumberFormat("en-KE").format(amount)}`;

export function divide(total: number, weights: Record<string, number>): Record<string, number> {
  throw new Error(`TODO: divide(${total}, ${Object.keys(weights).length} people)`);
}

export function owed(expense: Expense): Record<string, number> {
  throw new Error(`TODO: owed(${expense.description})`);
}

export function balances(people: string[], expenses: Expense[]): Record<string, number> {
  throw new Error(`TODO: balances(${people.length} people, ${expenses.length} expenses)`);
}

export function settleUp(balance: Record<string, number>): Transfer[] {
  throw new Error(`TODO: settleUp(${Object.keys(balance).length} people)`);
}

export function summary(tripName: string, people: string[], expenses: Expense[]): string {
  throw new Error(`TODO: summary(${tripName}, ${people.length}, ${expenses.length})`);
}
