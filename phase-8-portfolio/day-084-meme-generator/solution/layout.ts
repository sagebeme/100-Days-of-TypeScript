// Where the words go on a meme. No canvas here: text is measured through a function you pass in, so
// the page uses the real canvas and the tests use a predictable fake.
export type Measure = (text: string, fontSize: number) => number; // the width, in pixels

// Break text into lines no wider than maxWidth. Words move to the next line whole; a single word too
// long for any line is cut, so nothing ever runs off the image.
export function wrapText(text: string, maxWidth: number, fontSize: number, measure: Measure): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  const push = (word: string) => {
    // Cut a word that can't fit on a line of its own.
    let rest = word;
    while (measure(rest, fontSize) > maxWidth && rest.length > 1) {
      let cut = rest.length - 1;
      while (cut > 1 && measure(rest.slice(0, cut), fontSize) > maxWidth) cut--;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    return rest;
  };
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate, fontSize) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = push(word);
  }
  if (line) lines.push(line);
  return lines;
}

export interface Box {
  width: number;
  height: number;
}

export interface Fit {
  fontSize: number;
  lines: string[];
  lineHeight: number; // pixels between baselines
}

// The biggest font size, from max down to min, at which the wrapped text fits the box. If even the
// smallest size doesn't fit, it uses the smallest and keeps every line: never silently drops words.
export function fitText(text: string, box: Box, measure: Measure, options: { min?: number; max?: number; lineSpacing?: number } = {}): Fit {
  const min = options.min ?? 16;
  const max = options.max ?? 96;
  const spacing = options.lineSpacing ?? 1.1;
  for (let size = max; size >= min; size -= 2) {
    const lines = wrapText(text, box.width, size, measure);
    if (lines.length * size * spacing <= box.height) return { fontSize: size, lines, lineHeight: size * spacing };
  }
  return { fontSize: min, lines: wrapText(text, box.width, min, measure), lineHeight: min * spacing };
}

export interface Caption {
  text: string;
  position: "top" | "bottom";
}

export interface PlacedCaption extends Fit {
  x: number; // the centre of each line
  y: number[]; // the baseline of each line
}

// Top text hangs from the top, bottom text sits on the bottom, each in up to a third of the image,
// inside a margin of 5%. Classic meme captions are in capitals.
export function layoutMeme(image: Box, captions: Caption[], measure: Measure, uppercase = true): PlacedCaption[] {
  const margin = Math.round(Math.min(image.width, image.height) * 0.05);
  const box = { width: image.width - margin * 2, height: Math.round(image.height / 3) };
  const max = Math.round(image.height / 7);
  return captions
    .filter((c) => c.text.trim())
    .map((caption) => {
      const text = uppercase ? caption.text.toUpperCase() : caption.text;
      const fit = fitText(text, box, measure, { min: Math.max(12, Math.round(max / 4)), max });
      const block = fit.lines.length * fit.lineHeight;
      const top = caption.position === "top" ? margin : image.height - margin - block;
      // Baselines: the first line's baseline is one font size below the top of the block.
      const y = fit.lines.map((_, i) => Math.round(top + fit.fontSize + i * fit.lineHeight));
      return { ...fit, x: Math.round(image.width / 2), y };
    });
}

// "When the matatu leaves without you!" -> "when-the-matatu-leaves-without-you.png"
export function fileName(captions: Caption[]): string {
  const words = captions.map((c) => c.text).join(" ").toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "");
  const slug = words.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return `${slug || "meme"}.png`;
}
