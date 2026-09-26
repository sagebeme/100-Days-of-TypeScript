// A small accessibility audit: the checks that catch most real problems, written by hand so you know
// what each rule means. (Tools like axe-core do hundreds more; these are the ones that matter most.)

// --- Contrast (WCAG 2.2) ---

// How bright a colour looks to a person, from 0 (black) to 1 (white). Green counts most, blue least.
export function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Not a colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(full.slice(i, i + 2), 16) / 255;
    // Screens don't show light evenly: undo the "gamma" to get how much light there really is.
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// From 1:1 (the same colour) to 21:1 (black on white). Body text needs 4.5, large text 3.
export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface Problem {
  rule: string;
  message: string;
}

export function auditColours(palette: Record<string, string>, pairs: { fg: string; bg: string; large?: boolean }[]): Problem[] {
  return pairs.flatMap(({ fg, bg, large }) => {
    const ratio = contrastRatio(palette[fg], palette[bg]);
    const needed = large ? 3 : 4.5;
    return ratio >= needed ? [] : [{ rule: "contrast", message: `${fg} on ${bg} is ${ratio.toFixed(2)}:1, needs ${needed}:1` }];
  });
}

// --- The page ---

function describe(element: Element): string {
  const id = element.id ? `#${element.id}` : "";
  const text = (element.textContent ?? "").trim().slice(0, 30);
  return `<${element.tagName.toLowerCase()}${id}>${text ? ` "${text}"` : ""}`;
}

// What a screen reader would call this element.
export function accessibleName(element: Element): string {
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" ")
      .trim();
  }
  const label = element.getAttribute("aria-label");
  if (label?.trim()) return label.trim();
  if (element.tagName === "IMG") return element.getAttribute("alt") ?? "";
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(element.tagName)) {
    const id = element.id;
    const forLabel = id ? element.ownerDocument.querySelector(`label[for="${id}"]`) : null;
    return (forLabel ?? element.closest("label"))?.textContent?.trim() ?? "";
  }
  // Buttons and links are named by their content, including the alt text of images inside them.
  let name = "";
  for (const node of element.childNodes) {
    if (node.nodeType === 3) name += node.textContent;
    else if (node.nodeType === 1 && (node as Element).getAttribute("aria-hidden") !== "true") name += accessibleName(node as Element);
  }
  return name.replace(/\s+/g, " ").trim();
}

export function auditDocument(doc: Document): Problem[] {
  const problems: Problem[] = [];
  const problem = (rule: string, message: string) => problems.push({ rule, message });

  if (!doc.documentElement.getAttribute("lang")) problem("html-lang", "<html> needs lang, so screen readers speak it in the right language");

  const viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute("content");
  if (!viewport) problem("viewport", "No viewport meta tag: phones will show a shrunken desktop page");
  else if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/.test(viewport)) problem("viewport", "Don't stop people zooming in");

  for (const link of doc.querySelectorAll('link[rel="stylesheet"]')) {
    if (/^(https?:)?\/\//.test(link.getAttribute("href") ?? "")) {
      problem("render-blocking", `${link.getAttribute("href")} is a stylesheet from another server: nothing shows until it arrives`);
    }
  }

  for (const img of doc.querySelectorAll("img")) {
    if (!img.hasAttribute("alt")) problem("img-alt", `${describe(img)} has no alt (use alt="" if it's decoration)`);
    if (!img.hasAttribute("width") || !img.hasAttribute("height")) problem("img-size", `${describe(img)} has no width and height: the page jumps when it loads`);
    if (img.getAttribute("fetchpriority") !== "high" && img.getAttribute("loading") !== "lazy") {
      problem("img-lazy", `${describe(img)} isn't the main image, so it should be loading="lazy"`);
    }
  }

  for (const control of doc.querySelectorAll("input, select, textarea")) {
    if (/^(hidden|submit|button|reset)$/.test(control.getAttribute("type") ?? "")) continue;
    if (!accessibleName(control)) problem("label", `${describe(control)} has no label (a placeholder isn't one)`);
  }

  for (const element of doc.querySelectorAll("button, a[href], [role='button']")) {
    if (!accessibleName(element)) problem("name", `${describe(element)} has no accessible name: a screen reader just says "button"`);
  }

  const headings = [...doc.querySelectorAll("h1, h2, h3, h4, h5, h6")].map((h) => Number(h.tagName[1]));
  if (headings.filter((level) => level === 1).length !== 1) problem("headings", `There should be exactly one <h1>, not ${headings.filter((l) => l === 1).length}`);
  headings.forEach((level, i) => {
    if (i > 0 && level > headings[i - 1] + 1) problem("headings", `<h${headings[i - 1]}> is followed by <h${level}>: a level is skipped`);
  });

  for (const element of doc.querySelectorAll("[tabindex]")) {
    if (Number(element.getAttribute("tabindex")) > 0) problem("tabindex", `${describe(element)} has a positive tabindex, which scrambles the keyboard order`);
  }

  return problems;
}
