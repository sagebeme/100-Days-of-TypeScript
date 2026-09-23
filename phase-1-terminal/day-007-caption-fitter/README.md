# Day 7: Caption Fitter for SMS and X

Watch the video: *(not recorded yet)*

## The brief

You're posting the same caption to a text message and to X. Each platform has its own length rule, and SMS has a twist: a single text holds 160 characters, but once you go over that, multipart messages only fit 153 characters per part — 7 characters per segment are eaten by headers that stitch the parts back together on the other end.

```
smsParts("a".repeat(160))   →  1
smsParts("a".repeat(161))   →  2
fitsInXPost("a".repeat(280)) →  true
fitsInXPost("a".repeat(281)) →  false
```

## What you'll use

- String methods — specifically `.length`
- Loops, or in this case a formula that does the same job a loop would: `Math.ceil` to round *up* to the next whole part

## Steps

1. Open `starter/caption-fitter.ts`.
2. `smsParts`: if `text.length` is 160 or less, return `1`. Otherwise, return `Math.ceil(text.length / 153)`.
3. `fitsInXPost`: return whether `text.length` is 280 or less.

```bash
npm test -- day-007
```

## When you're stuck

- **`smsParts` returns `0` for long text** — check you're using `Math.ceil`, not `Math.floor`. A 200-character text needs 2 parts (`200 / 153 ≈ 1.3`, rounded *up*), not 1.
- **Off-by-one right at the 160/161 boundary** — the 160-character rule only applies to a *single* SMS. The moment you cross into needing multiple parts, every part (including earlier ones) is limited to 153, not 160. That's why `smsParts` checks `<= 160` first, as its own special case.
- **Still stuck?** Read `solution/caption-fitter.ts`, then close it and write your own from memory.
