// Already written: a generated cover for each project, so cards have something to look at before you
// have screenshots. The same slug always gives the same picture. Decorative: hidden from screen readers.

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  return h >>> 0;
}

const PALETTES = [
  ["#0f766e", "#14b8a6", "#ccfbf1"],
  ["#9a3412", "#f97316", "#ffedd5"],
  ["#3730a3", "#818cf8", "#e0e7ff"],
  ["#86198f", "#e879f9", "#fae8ff"],
  ["#166534", "#4ade80", "#dcfce7"],
  ["#1e40af", "#60a5fa", "#dbeafe"],
];

export function cover(slug: string, title: string): string {
  const h = hash(slug);
  const [deep, mid, light] = PALETTES[h % PALETTES.length];
  const shapes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const n = hash(`${slug}:${i}`);
    const x = n % 400;
    const y = (n >>> 9) % 225;
    const r = 30 + ((n >>> 17) % 90);
    shapes.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? mid : light}" opacity="${i % 2 ? 0.55 : 0.25}"/>`);
  }
  const initials = title
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return `<svg class="cover" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="225" fill="${deep}"/>${shapes.join("")}<text x="28" y="196" font-family="ui-sans-serif, system-ui, sans-serif" font-size="64" font-weight="800" fill="#fff" opacity="0.92" letter-spacing="-2">${initials}</text></svg>`;
}
