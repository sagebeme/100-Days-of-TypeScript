// A small accessibility audit: the checks that catch most real problems, written by hand so you know
// what each rule means. (Tools like axe-core do hundreds more; these are the ones that matter most.)

// --- Contrast (WCAG 2.2) ---

// TODO: how bright a colour looks to a person, from 0 (black) to 1 (white).
// For "#rrggbb" (or "#rgb"): each channel / 255, then "linearise" it:
//   c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
// and weight them: 0.2126 R + 0.7152 G + 0.0722 B. Throw on anything that isn't a colour.
export function luminance(hex: string): number {
  void hex;
  return 0;
}

// TODO: (lighter + 0.05) / (darker + 0.05), using luminance. 1 for the same colour, 21 for black on white.
export function contrastRatio(a: string, b: string): number {
  void [a, b];
  return 1;
}

export interface Problem {
  rule: string;
  message: string;
}

// TODO: a "contrast" problem for every pair under 4.5:1 (3:1 when large), with a message like
// "muted on surface is 2.52:1, needs 4.5:1".
export function auditColours(palette: Record<string, string>, pairs: { fg: string; bg: string; large?: boolean }[]): Problem[] {
  void [palette, pairs];
  return [];
}

// --- The page ---

// TODO: what a screen reader would call this element, in this order:
// - aria-labelledby: the text of the elements with those ids
// - aria-label
// - an <img>: its alt
// - an input, select or textarea: the text of <label for="its id">, or of the <label> around it
// - otherwise (buttons, links): its text, including the names of child elements, skipping aria-hidden ones
export function accessibleName(element: Element): string {
  return element.textContent?.trim() ?? "";
}

// TODO: one Problem per thing wrong, with these rule names:
// - "html-lang": <html> has no lang
// - "viewport": no <meta name="viewport">, or it stops zooming (user-scalable=no or 0, maximum-scale=1)
// - "render-blocking": a <link rel="stylesheet"> from another server (href starting http:, https: or //)
// - "img-alt": an <img> with no alt attribute at all (alt="" is fine: it means decoration)
// - "img-size": an <img> without both width and height
// - "img-lazy": an <img> that isn't fetchpriority="high" and isn't loading="lazy"
// - "label": an input, select or textarea (not hidden, submit, button or reset) with no accessible name
// - "name": a button, a[href] or [role=button] with no accessible name
// - "headings": not exactly one <h1>, or a level skipped (an <h2> followed by an <h4>)
// - "tabindex": any tabindex above 0
export function auditDocument(doc: Document): Problem[] {
  void doc;
  return [];
}
