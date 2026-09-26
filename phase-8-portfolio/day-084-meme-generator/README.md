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

## Done when

```bash
npm test -- day-084
npx vite phase-8-portfolio/day-084-meme-generator/starter
```

## Stretch

- Drag the captions to move them.
- Paste a picture from the clipboard.
- Share straight to WhatsApp with the Web Share API (`navigator.share` with files).
