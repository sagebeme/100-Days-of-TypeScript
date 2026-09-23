export function usToEuSize(usSize: number): number {
  return usSize + 33;
}

export function convertPriceToKes(usdPrice: number, exchangeRate: number): number {
  return Math.round(usdPrice * exchangeRate);
}
