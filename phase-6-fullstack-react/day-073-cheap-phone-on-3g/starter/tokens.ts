// Every colour on the page comes from here: main.tsx turns these into CSS variables, and the tests
// check every text-on-background pair the page uses against WCAG's contrast rules. One source, so the
// page can't drift away from what was checked.
// TODO: two of the light colours are too pale to read. auditColours will tell you which.
export const light = {
  bg: "#f6f3ee",
  surface: "#ffffff",
  text: "#1b1722",
  muted: "#a8a29e",
  brand: "#fb923c",
  brandText: "#ffffff",
  line: "#e3ddd3",
  focus: "#2563eb",
};

export const dark: typeof light = {
  bg: "#121016",
  surface: "#1c1922",
  text: "#f3eff7",
  muted: "#b4acbf",
  brand: "#fb8a4c",
  brandText: "#1b1722",
  line: "#332e3b",
  focus: "#93b4ff",
};

export type Palette = typeof light;

// Which colour is ever written on which. "large" text (24px, or 19px bold) only needs 3:1.
export const PAIRS: { fg: keyof Palette; bg: keyof Palette; large?: boolean }[] = [
  { fg: "text", bg: "bg" },
  { fg: "text", bg: "surface" },
  { fg: "muted", bg: "bg" },
  { fg: "muted", bg: "surface" },
  { fg: "brandText", bg: "brand" },
  { fg: "brand", bg: "surface" }, // links
  { fg: "brand", bg: "bg", large: true }, // the price
];
