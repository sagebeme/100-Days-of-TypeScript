export function countAttemptsUntilCorrect(guesses: string[], answer: string): number {
  let attempts = 0;
  let index = 0;
  while (index < guesses.length) {
    attempts += 1;
    if (guesses[index] === answer) {
      return attempts;
    }
    index += 1;
  }
  return -1;
}
