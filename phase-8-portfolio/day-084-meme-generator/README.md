# Day 84: Meme Generator

*A brief and a test suite. No walkthrough.*

## The brief

Build a meme generator that runs entirely in the browser. Pick a picture (your own photo, or backgrounds you draw in code), type top and bottom text, and download a PNG. The photo never leaves the device: no uploads, no server.

The hard part is the words. They must always fit: as big as possible, wrapped onto lines, and never running off the picture, whatever someone types.

## The layout rules (tested)

`layout.ts` never touches a canvas. It measures text through a `measure(text, fontSize)` function you pass in. The page passes the canvas's `measureText`; the tests pass a fake where every character is 0.6 × the font size wide.

- **Wrap** words onto lines no wider than the box. A word too long for any line is cut, not allowed to overflow.
- **Fit**: the biggest font size (from `max` down, in steps of 2) at which the wrapped lines fit both the width and the height. If nothing fits, use the smallest size and keep every word. Never drop text.
- **Lay out** the meme: top text hangs from the top, bottom text sits on the bottom, each within a third of the picture and a 5% margin, centred, in CAPITALS unless told otherwise. It scales with the picture.
- **Name the file** after the words: `when-the-matatu-leaves.png`, or `meme.png`.

## The page (yours to design)

Draw with a thick outline under the text so it reads on any picture, and offer white or black. Use a real `<input type="file">`, keyboard-friendly background buttons, and a canvas that describes itself (`role="img"` with an `aria-label` of the text). Don't use copyrighted meme images: draw your own backgrounds.

## Steps

1. Read the tests, and note the fake `measure`: each character is 0.6 × the font size wide.
2. `wrapText`, including cutting words too long for any line. `npm test -- day-084 -t wrapping`.
3. `fitText`: from `max` down in steps of 2, wrap at each size and keep the first that fits the width and the height.
4. `layoutMeme` and `fileName`.
5. Run the tests, then build the page in `main.ts`: draw the captions on a canvas with `measureText`, and download the PNG.

## Done when

```bash
npm test -- day-084
npx vite phase-8-portfolio/day-084-meme-generator/starter
```

## Stretch

- Drag the captions to move them.
- Paste a picture from the clipboard.
- Share straight to WhatsApp with the Web Share API (`navigator.share` with files).

## Check yourself

1. With the tests' fake `measure` (each character is 0.6 × the font size wide), predict `wrapText("  when   the matatu leaves  ", 60, 10, measure)`.
2. Predict `wrapText("supercalifragilistic", 60, 10, measure)` and `wrapText("", 60, 10, measure)`.
3. Why does `layout.ts` take a `measure` function instead of calling the canvas's `measureText` itself?
4. Predict `fileName([{ text: "When the MATATU leaves!" }])` and `fileName([{ text: "  " }])`.

<details><summary>Answers</summary>

1. `["when the", "matatu", "leaves"]`. At 6px a character, a line holds 10, and runs of spaces are one gap.
2. `["supercalif", "ragilistic"]`: a word too long for any line is cut, not allowed to run off. And `[]`: an empty caption has no lines at all.
3. So the rules can be tested with no browser and a predictable width. The page passes the real canvas; the tests pass the fake.
4. `"when-the-matatu-leaves.png"` and `"meme.png"`.

</details>

## When you're stuck

- **Extra spaces end up in a line** — split on runs of whitespace (`text.trim().split(/\s+/)`), and treat an empty caption as no lines at all.
- **A long word runs off the edge** — when a word alone is too wide, cut it into the longest pieces that fit, one per line, then carry on.
- **Words go missing when nothing fits** — when no size works, return the lines wrapped at `min`, even though they're too tall. Never trim them.
- **The top line sits on the margin, or above it** — each `y` is a line's *baseline*, so the first top line's `y` is the margin plus the font size, and each next line is one `lineHeight` lower.
- **A caption is too tall, or the text doesn't grow with the picture** — fit each caption into a box a third of the picture tall and as wide as the picture minus the 5% margin on each side, and work out the biggest font size from the picture's size, not a fixed number.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
