// Letters with a usual Latin spelling that Unicode decomposition (below) doesn't give us.
export const LETTERS: Record<string, string> = {
  ß: "ss",
  æ: "ae",
  Æ: "AE",
  ø: "o",
  Ø: "O",
  œ: "oe",
  Œ: "OE",
  đ: "d",
  Đ: "D",
  ł: "l",
  Ł: "L",
  þ: "th",
  Þ: "TH",
  "&": " and ",
  "@": " at ",
};

// "é" is really "e" plus a combining accent (after NFD). Keep the letter, drop the accent.
export function transliterate(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7f]|[&@]/g, (ch) => LETTERS[ch] ?? ch);
}
