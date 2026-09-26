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
  // Akan, Ewe, Hausa, Fula and others (#15)
  ɔ: "o",
  Ɔ: "O",
  ɛ: "e",
  Ɛ: "E",
  ŋ: "ng",
  Ŋ: "NG",
  ɓ: "b",
  Ɓ: "B",
  ɗ: "d",
  Ɗ: "D",
  ƙ: "k",
  Ƙ: "K",
  ƴ: "y",
  Ƴ: "Y",
  "&": " and ",
  "@": " at ",
};

// "é" is really "e" plus a combining accent (after NFD). Keep the letter, drop the accent.
export function transliterate(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x00-\x7f]|[&@]/g, (ch) => LETTERS[ch] ?? ch);
}
