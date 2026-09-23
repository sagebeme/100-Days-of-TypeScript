export function pickRandomWord(words: string[], random: () => number = Math.random): string {
  const index = Math.floor(random() * words.length);
  return words[index];
}
