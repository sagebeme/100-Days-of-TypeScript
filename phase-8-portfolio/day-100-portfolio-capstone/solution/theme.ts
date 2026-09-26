// Already written: the look. System fonts (nothing to download), one accent colour, a type scale
// that grows with the screen, and a dark mode that follows the visitor's settings. All colours pass
// WCAG AA contrast in both modes.

export const THEME_CSS = `:root {
  color-scheme: light;
  --bg: #f7f7f4; --surface: #ffffff; --ink: #14171a; --muted: #5a6168; --line: #e3e3dd;
  --accent: #0f766e; --accent-ink: #ffffff; --accent-soft: #d5f0ec; --focus: #c2410c;
  --shadow: 0 1px 2px rgb(20 23 26 / 6%), 0 8px 24px rgb(20 23 26 / 6%);
  --radius: 14px;
}
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --bg: #0f1214; --surface: #171b1e; --ink: #e8ebed; --muted: #9aa3ab; --line: #262c31;
    --accent: #5eead4; --accent-ink: #042f2e; --accent-soft: #123a37; --focus: #fdba74;
    --shadow: 0 1px 2px rgb(0 0 0 / 30%), 0 8px 24px rgb(0 0 0 / 25%);
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; scroll-padding-top: 1rem; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 1rem/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
.wrap { width: min(100% - 2rem, 68rem); margin-inline: auto; }
a { color: var(--accent); text-underline-offset: 0.2em; text-decoration-thickness: 1px; }
a:hover { text-decoration-thickness: 2px; }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; border-radius: 4px; }
h1, h2, h3 { line-height: 1.15; letter-spacing: -0.025em; text-wrap: balance; margin: 0; }
p { text-wrap: pretty; }
.skip { position: absolute; left: 1rem; top: -3rem; padding: 0.5rem 1rem; background: var(--ink); color: var(--bg); border-radius: 8px; z-index: 10; }
.skip:focus { top: 1rem; }

header.site { border-bottom: 1px solid var(--line); }
header.site .wrap { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; justify-content: space-between; align-items: center; padding: 1rem 0; }
.brand { font-weight: 800; font-size: 1.05rem; color: var(--ink); text-decoration: none; letter-spacing: -0.02em; }
header.site nav { display: flex; gap: 1.25rem; }
header.site nav a { color: var(--muted); text-decoration: none; font-weight: 600; font-size: 0.95rem; }
header.site nav a:hover { color: var(--ink); }

.eyebrow { margin: 0 0 0.75rem; color: var(--muted); font-size: 0.8rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.lede { font-size: clamp(1.1rem, 1rem + 0.6vw, 1.35rem); color: var(--muted); max-width: 38em; margin: 1rem 0 0; }
.actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.75rem 0 0; }
.button { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 2.75rem; padding: 0 1.25rem; border-radius: 999px; background: var(--accent); color: var(--accent-ink); font-weight: 700; text-decoration: none; border: 2px solid var(--accent); }
.button:hover { filter: brightness(1.08); }
.button.quiet { background: transparent; color: var(--ink); border-color: var(--line); }
.button.quiet:hover { border-color: var(--muted); filter: none; }

.hero { padding: clamp(3rem, 8vw, 6.5rem) 0 clamp(2.5rem, 6vw, 4.5rem); }
.hero h1 { font-size: clamp(2.6rem, 1.6rem + 5vw, 5rem); letter-spacing: -0.045em; }

section.wrap { margin-bottom: clamp(3rem, 7vw, 5rem); }
section.wrap > h2 { font-size: clamp(1.4rem, 1.2rem + 1vw, 1.9rem); margin-bottom: 1.5rem; }

.cards { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr)); }
.card { position: relative; display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); transition: transform 0.15s ease, border-color 0.15s ease; }
.card:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--accent) 45%, var(--line)); }
.card:focus-within { outline: 3px solid var(--focus); outline-offset: 3px; }
.card .cover { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; }
.card-body { padding: 1.1rem 1.25rem 1.3rem; display: flex; flex-direction: column; gap: 0.6rem; flex: 1; }
.card h3 { font-size: 1.2rem; }
.card h3 a { color: var(--ink); text-decoration: none; }
.card h3 a::after { content: ""; position: absolute; inset: 0; } /* the whole card is the link */
.card h3 a:focus-visible { outline: none; }
.card p { margin: 0; color: var(--muted); }
.card .tags { margin-top: auto; padding-top: 0.4rem; }

.tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.4rem; }
.tags li, .tags a { font-size: 0.8rem; font-weight: 600; color: var(--muted); }
.card .tags li, .tags a { padding: 0.15rem 0.6rem; border-radius: 999px; background: var(--accent-soft); color: color-mix(in srgb, var(--accent) 70%, var(--ink)); }
.tags a { text-decoration: none; }
.tags a:hover { text-decoration: underline; }

.filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
.filters a { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 2.25rem; padding: 0 0.85rem; border: 1.5px solid var(--line); border-radius: 999px; color: var(--ink); text-decoration: none; font-size: 0.9rem; font-weight: 600; background: var(--surface); }
.filters a span { color: var(--muted); font-weight: 500; font-variant-numeric: tabular-nums; }
.filters a:hover { border-color: var(--muted); }
.filters a[aria-current="page"] { background: var(--ink); border-color: var(--ink); color: var(--bg); }
.filters a[aria-current="page"] span { color: inherit; opacity: 0.75; }

.list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--line); }
.list li { display: grid; grid-template-columns: 4rem 1fr; gap: 1rem; padding: 1.1rem 0; border-bottom: 1px solid var(--line); }
.list .year { color: var(--muted); font-variant-numeric: tabular-nums; font-size: 0.9rem; padding-top: 0.15rem; }
.list h3 { font-size: 1.05rem; }
.list h3 a { color: var(--ink); }
.list p { margin: 0.25rem 0 0; color: var(--muted); }

.about .prose { max-width: 40em; font-size: 1.1rem; }
.about .prose p { margin: 0 0 1rem; }

.project { padding-top: 2rem; }
.crumbs { margin: 0 0 2rem; font-weight: 600; }
.crumbs a { text-decoration: none; }
.project header { max-width: 46rem; }
.project h1 { font-size: clamp(2.2rem, 1.5rem + 3.5vw, 3.8rem); letter-spacing: -0.04em; }
.project header .tags { margin-top: 1.25rem; }
.hero-cover { margin: 2.5rem 0; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow); }
.hero-cover .cover { display: block; width: 100%; height: auto; aspect-ratio: 21 / 9; }
.story { display: grid; gap: 2rem; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); }
.story h2, .highlights h2 { font-size: 1.15rem; margin-bottom: 0.6rem; }
.story p { margin: 0; color: var(--muted); font-size: 1.05rem; }
.highlights { margin: 3rem 0; padding: 1.5rem 1.75rem; border-radius: var(--radius); background: var(--accent-soft); }
.highlights ul { margin: 0; padding-left: 1.2rem; }
.highlights li { margin: 0.35rem 0; }
.highlights li::marker { color: var(--accent); }

.tag-page { padding-top: 2rem; }
.tag-page h1 { font-size: clamp(2rem, 1.5rem + 2.5vw, 3rem); margin-bottom: 1.5rem; }
.count { font-size: 0.45em; color: var(--muted); font-weight: 600; letter-spacing: 0; vertical-align: middle; }
.not-found { padding: 5rem 0; }
.not-found h1 { font-size: clamp(2rem, 1.5rem + 3vw, 3.5rem); }

footer.site { border-top: 1px solid var(--line); padding: 2.5rem 0 3rem; }
footer.site .cta { font-size: clamp(1.15rem, 1rem + 0.8vw, 1.5rem); font-weight: 700; letter-spacing: -0.02em; margin: 0 0 0.75rem; }
footer.site .small { color: var(--muted); font-size: 0.9rem; margin: 0; }
footer.site .small a { color: inherit; }

@media (max-width: 40rem) {
  .list li { grid-template-columns: 1fr; gap: 0.25rem; }
}
@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
  .card:hover { transform: none; }
}
`;

// A favicon from your initials.
export function favicon(name: string): string {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0f766e"/><text x="32" y="42" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="800" fill="#fff">${initials}</text></svg>`;
}
