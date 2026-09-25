export interface BillSplit {
  tip: number;
  grandTotal: number;
  perPerson: number;
}

export function splitBill(total: number, people: number, tipPercent: number): BillSplit {
  // TODO: throw "Enter a total above 0" if total isn't a positive, finite number
  // TODO: throw "Enter how many people are paying" if people isn't a whole number of 1 or more
  // TODO: throw "Tip can't be negative" if tipPercent is below 0
  // TODO: tip = total * tipPercent / 100, rounded to the nearest shilling
  // TODO: perPerson = grand total / people, rounded UP
  throw new Error("not implemented yet");
}

export function formatKes(amount: number): string {
  // TODO: 4800 -> "KES 4,800"
  throw new Error("not implemented yet");
}
