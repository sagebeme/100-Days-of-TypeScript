// Already written: the site's look: a calm reading theme. Comfortable line length (about 68 characters), generous line
// height, system fonts that load instantly, and a dark mode that follows the reader's settings.
export const THEME_CSS = `:root {
  color-scheme: light;
  --bg: #fbfaf7; --ink: #1d1b19; --muted: #6b645c; --line: #e8e3da; --accent: #b4441b; --code-bg: #f1ede5;
}
@media (prefers-color-scheme: dark) {
  :root { color-scheme: dark; --bg: #151412; --ink: #ece7df; --muted: #a39b90; --line: #2e2b27; --accent: #f08a5d; --code-bg: #211f1c; }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 1.0625rem/1.7 ui-serif, Georgia, "Iowan Old Style", serif; -webkit-font-smoothing: antialiased; }
main, header.site, footer.site { width: min(100% - 2.5rem, 42rem); margin-inline: auto; }
header.site { display: flex; justify-content: space-between; align-items: baseline; padding: 2rem 0 1rem; border-bottom: 1px solid var(--line); font-family: ui-sans-serif, system-ui, sans-serif; }
.brand { font-weight: 800; letter-spacing: -0.02em; color: var(--ink); text-decoration: none; font-size: 1.15rem; }
.rss { font-size: 0.85rem; color: var(--muted); }
footer.site { padding: 3rem 0; margin-top: 3rem; border-top: 1px solid var(--line); color: var(--muted); font: 0.85rem/1.5 ui-sans-serif, system-ui, sans-serif; }
a { color: var(--accent); text-underline-offset: 0.2em; text-decoration-thickness: 1px; }
a:hover { text-decoration-thickness: 2px; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 3px; }
h1, h2, h3 { font-family: ui-sans-serif, system-ui, sans-serif; line-height: 1.2; letter-spacing: -0.02em; text-wrap: balance; }
.intro { font-size: clamp(1.6rem, 1.2rem + 2vw, 2.3rem); margin: 2.5rem 0 1rem; }
.posts { list-style: none; padding: 0; margin: 0; }
.posts li { padding: 1.5rem 0; border-bottom: 1px solid var(--line); }
.posts li:last-child { border-bottom: 0; }
.posts h2 { margin: 0.25rem 0 0.4rem; font-size: 1.35rem; }
.posts h2 a { color: var(--ink); text-decoration: none; }
.posts h2 a:hover { color: var(--accent); }
.posts p { margin: 0.3rem 0 0; }
.meta { color: var(--muted); font: 0.85rem/1.4 ui-sans-serif, system-ui, sans-serif; margin: 0; }
.post header { margin: 2.5rem 0 2rem; }
.post h1 { font-size: clamp(1.9rem, 1.3rem + 2.8vw, 2.8rem); margin: 0.4rem 0 0.8rem; }
.tags { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; font: 0.85rem ui-sans-serif, system-ui, sans-serif; }
.tags a { text-decoration: none; padding: 0.15rem 0.6rem; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); }
.prose h2 { margin-top: 2.2rem; font-size: 1.45rem; }
.prose h3 { margin-top: 1.8rem; font-size: 1.15rem; }
.prose img { max-width: 100%; height: auto; border-radius: 8px; }
.prose blockquote { margin: 1.5rem 0; padding: 0.2rem 0 0.2rem 1.2rem; border-left: 3px solid var(--accent); color: var(--muted); font-style: italic; }
.prose code { font: 0.9em ui-monospace, "SF Mono", Menlo, Consolas, monospace; background: var(--code-bg); padding: 0.1em 0.35em; border-radius: 4px; }
.prose pre { background: var(--code-bg); padding: 1rem 1.2rem; border-radius: 8px; overflow-x: auto; line-height: 1.5; }
.prose pre code { background: none; padding: 0; }
.prose hr { border: 0; border-top: 1px solid var(--line); margin: 2.5rem 0; }
.back { margin-top: 3rem; font-family: ui-sans-serif, system-ui, sans-serif; }
`;
