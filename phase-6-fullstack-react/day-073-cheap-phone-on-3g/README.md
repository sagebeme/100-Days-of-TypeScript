# Day 73: Works on a Cheap Phone on 3G — Accessibility and Performance

Watch the video: *(not recorded yet)*

## The brief

Here's the ticket page for the Gengetone Block Party. On your laptop, on Wi-Fi, it looks fine. Now picture the people actually buying tickets:

- a KES 8,000 Android phone, on a patchy 3G signal in a matatu;
- someone who can't see well, reading with a screen reader, or zoomed to 200%;
- someone with a broken trackpad, using only a keyboard;
- someone who gets motion-sick from things that move on their own.

For all of them, this page is broken in about twenty ways. None of them show up when you look at it. Today you write the tool that finds them, then fix every one.

## What's wrong (you'll find them all)

- **Colours too pale to read.** Grey text on white at 2.5:1, and white text on light orange at 2.2:1. WCAG asks for 4.5:1.
- **Things a screen reader can't name.** Icon buttons that just say "button". An email box with a placeholder but no label. Images with no alt text.
- **A mouse-only Buy button.** It's a `<div>` with a click handler: Tab never reaches it, and Enter does nothing. It also has `tabindex="1"`, which scrambles the whole keyboard order.
- **Zoom switched off**, with `user-scalable=no`. For someone with low vision, that makes the page unusable.
- **A heading outline with holes.** An `<h1>` followed by `<h4>`s, so screen-reader users can't jump through the page by headings.
- **A page that jumps.** Images without `width` and `height` push everything down as they arrive, so you tap the wrong thing.
- **Slow on 3G.** A font from Google Fonts blocks the page until it arrives. Every image downloads at once, including ones nobody has scrolled to. And a 150 KB seat map is in the first download, although most fans never open it.
- **Motion nobody can stop.** The Buy button pulses forever, even for people whose phone is set to "reduce motion".

## What you'll build

1. **`audit.ts`**: the WCAG contrast formula, `accessibleName` (what a screen reader would call an element), and `auditDocument`, which checks a page for the problems above.
2. **The fixes**, in `index.html`, `tokens.ts`, `TicketPage.tsx` and `style.css`. The tests run your audit on the real page, and it must come back empty.
3. **Code splitting**: `React.lazy(() => import("./SeatMap.tsx"))` with `<Suspense>`, so the seat map is downloaded only when someone taps "Choose your seat". The tests build the page for production and hold it to a budget: under 75 KB gzipped for the first download, with no seat map in it.

## Steps

1. Run it: `npx vite phase-6-fullstack-react/day-073-cheap-phone-on-3g/starter`. Then try it the hard way: Tab through it without a mouse, zoom to 200%, and throttle the network to "Slow 3G" in DevTools.
2. `audit.ts`: `luminance` and `contrastRatio` first. `npm test -- day-073 -t contrast`.
3. The rest of `audit.ts`. Then run the page tests, and read the list of problems your audit found.
4. Fix them, one rule at a time, until the list is empty.
5. Make the seat map lazy, and check the budget:

   ```bash
   npm test -- day-073
   npx vite build phase-6-fullstack-react/day-073-cheap-phone-on-3g/starter   # read the sizes it prints
   ```

## An automated audit is a floor, not a ceiling

The audit can't tell that "Image 1" is a useless alt text, or that the tab order makes no sense. Nothing beats trying it yourself: with the keyboard only, with a screen reader (TalkBack on Android, VoiceOver on a Mac or iPhone), and on a slow connection.

## When you're stuck

- **Contrast is slightly off** — linearise each channel *before* weighting it, and add 0.05 to both luminances.
- **The icon buttons still have no name** — the `<svg>` inside is `aria-hidden`, so add an `aria-label` to the button itself.
- **The seat map is still in the first chunk** — any ordinary `import ... from "./SeatMap.tsx"` pulls it in. The only import left should be the one inside `lazy(() => import(...))`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
