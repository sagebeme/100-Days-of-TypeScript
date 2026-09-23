export function weeklyToMonthly(weeklySavings: number): number {
  return weeklySavings * 4;
}

export function monthsToAfford(price: number, monthlySavings: number): number {
  return Math.ceil(price / monthlySavings);
}

export function monthsToAffordFromWeekly(price: number, weeklySavings: number): number {
  return monthsToAfford(price, weeklyToMonthly(weeklySavings));
}
