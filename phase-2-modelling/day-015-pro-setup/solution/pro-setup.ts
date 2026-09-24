export function firstAbove(numbers: number[], threshold: number): number | undefined {
  return numbers.find((n) => n > threshold);
}

export function firstAboveOrDefault(numbers: number[], threshold: number, fallback: number): number {
  const found = firstAbove(numbers, threshold);
  if (found === undefined) {
    return fallback;
  }
  return found;
}
