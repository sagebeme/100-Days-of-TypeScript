import { describe, it, expect } from "vitest";
import { wrapText, fitText, layoutMeme, fileName, type Measure } from "./starter/layout.ts";

// A predictable stand-in for canvas.measureText: every character is 0.6 of the font size wide.
const measure: Measure = (text, size) => text.length * size * 0.6;

describe("wrapping", () => {
  it("fills each line with whole words, up to the width", () => {
    // At size 10 a character is 6px wide: 60px holds 10 characters.
    expect(wrapText("when the matatu leaves", 60, 10, measure)).toEqual(["when the", "matatu", "leaves"]);
    expect(wrapText("  lots   of    space  ", 600, 10, measure)).toEqual(["lots of space"]);
    expect(wrapText("", 60, 10, measure)).toEqual([]);
  });

  it("cuts a word that can't fit on any line, so nothing runs off the picture", () => {
    expect(wrapText("supercalifragilistic", 60, 10, measure)).toEqual(["supercalif", "ragilistic"]);
    expect(wrapText("ok aaaaaaaaaaaaaaa", 60, 10, measure)).toEqual(["ok", "aaaaaaaaaa", "aaaaa"]);
  });
});

describe("fitting", () => {
  it("uses the biggest font size at which the text fits the box", () => {
    const fit = fitText("HABARI", { width: 600, height: 200 }, measure, { min: 10, max: 100 });
    expect(fit).toMatchObject({ fontSize: 100, lines: ["HABARI"] }); // 6 × 60 = 360 wide
    expect(fit.lineHeight).toBeCloseTo(110); // 1.1 × the size
  });

  it("goes smaller until every line fits, height included", () => {
    const fit = fitText("THE LAST BUS TO RONGAI HAS GONE", { width: 400, height: 150 }, measure, { min: 10, max: 100 });
    expect(fit.lines.every((line) => measure(line, fit.fontSize) <= 400)).toBe(true);
    expect(fit.lines.length * fit.lineHeight).toBeLessThanOrEqual(150);
    // …and it's the biggest that does: 2 points bigger doesn't fit.
    const bigger = fitText("THE LAST BUS TO RONGAI HAS GONE", { width: 400, height: 150 }, measure, { min: fit.fontSize + 2, max: fit.fontSize + 2 });
    expect(bigger.lines.length * bigger.lineHeight > 150 || bigger.lines.some((l) => measure(l, bigger.fontSize) > 400)).toBe(true);
  });

  it("never drops words: if nothing fits, it uses the smallest size and keeps them all", () => {
    const words = "word ".repeat(40).trim();
    const fit = fitText(words, { width: 100, height: 20 }, measure, { min: 12, max: 48 });
    expect(fit.fontSize).toBe(12);
    expect(fit.lines.join(" ")).toBe(words);
  });
});

describe("laying out a meme", () => {
  const image = { width: 800, height: 800 };

  it("puts top text at the top and bottom text at the bottom, centred, in capitals, inside the margins", () => {
    const [top, bottom] = layoutMeme(image, [
      { text: "when the matatu leaves", position: "top" },
      { text: "just as you reach the stage", position: "bottom" },
    ], measure);
    expect(top.lines.join(" ")).toBe("WHEN THE MATATU LEAVES");
    expect(top.x).toBe(400);
    expect(top.y[0] - top.fontSize).toBeGreaterThanOrEqual(40); // 5% margin
    expect(bottom.y.at(-1)!).toBeLessThanOrEqual(800 - 40);
    expect(bottom.y[0]).toBeGreaterThan(top.y.at(-1)!);
    for (const caption of [top, bottom]) for (const line of caption.lines) expect(measure(line, caption.fontSize)).toBeLessThanOrEqual(720);
  });

  it("keeps each caption to a third of the picture, with lines spaced evenly", () => {
    const [top] = layoutMeme(image, [{ text: "a much longer caption that needs several lines to fit in", position: "top" }], measure);
    expect(top.lines.length * top.lineHeight).toBeLessThanOrEqual(800 / 3 + 1);
    expect(top.y[1] - top.y[0]).toBeCloseTo(top.lineHeight, 0);
  });

  it("skips empty captions, and can keep the case as typed", () => {
    expect(layoutMeme(image, [{ text: "  ", position: "top" }], measure)).toEqual([]);
    expect(layoutMeme(image, [{ text: "Sawa sawa", position: "bottom" }], measure, false)[0].lines).toEqual(["Sawa sawa"]);
  });

  it("scales with the picture", () => {
    const small = layoutMeme({ width: 400, height: 400 }, [{ text: "HI", position: "top" }], measure)[0];
    const big = layoutMeme({ width: 1200, height: 1200 }, [{ text: "HI", position: "top" }], measure)[0];
    expect(big.fontSize).toBeGreaterThan(small.fontSize);
  });
});

describe("file names", () => {
  it("names the download after the words", () => {
    expect(fileName([{ text: "When the matatu leaves!", position: "top" }, { text: "Pole sana", position: "bottom" }])).toBe("when-the-matatu-leaves-pole-sana.png");
    expect(fileName([{ text: "", position: "top" }])).toBe("meme.png");
    expect(fileName([{ text: "a ".repeat(100), position: "top" }]).length).toBeLessThanOrEqual(64);
  });
});
