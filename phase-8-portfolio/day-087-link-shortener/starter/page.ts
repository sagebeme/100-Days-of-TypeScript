// Already written: the home page, one form, served by the app. Styles and script are inline: it's one small page.
const STYLE = `
:root { color-scheme: light; --bg: #faf7ff; --surface: #fff; --ink: #1c1530; --muted: #625a78; --line: #e6dff5; --brand: #6d28d9; --brand-ink: #fff; --bad: #b91c1c; --focus: #db2777; }
@media (prefers-color-scheme: dark) { :root { color-scheme: dark; --bg: #110d1c; --surface: #1a1429; --ink: #f1ecfb; --muted: #aea4c4; --line: #2e2545; --brand: #a78bfa; --brand-ink: #1c0b3d; --bad: #f87171; --focus: #f472b6; } }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: radial-gradient(circle at 20% 0%, color-mix(in srgb, var(--brand) 14%, transparent), transparent 45%), var(--bg); color: var(--ink); font: 1rem/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
main { width: min(100% - 2rem, 34rem); padding: 3rem 0; }
h1 { margin: 0; font-size: clamp(2rem, 1.4rem + 3vw, 2.8rem); letter-spacing: -0.04em; line-height: 1.05; }
.lede { margin: 0.6rem 0 1.8rem; color: var(--muted); font-size: 1.1rem; }
form { display: grid; gap: 0.8rem; padding: 1.4rem; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 24px 60px -36px rgb(40 10 90 / 0.5); }
label { font-weight: 700; font-size: 0.9rem; }
.field { display: grid; gap: 0.3rem; }
.slug-row { display: flex; align-items: stretch; border: 1.5px solid var(--line); border-radius: 12px; background: var(--bg); overflow: hidden; }
.slug-row span { display: flex; align-items: center; padding: 0 0 0 0.9rem; color: var(--muted); white-space: nowrap; }
input { width: 100%; min-height: 3rem; padding: 0 0.9rem; border: 1.5px solid var(--line); border-radius: 12px; background: var(--bg); color: var(--ink); font: inherit; font-size: 1rem; }
.slug-row input { border: 0; padding-left: 0.1rem; background: transparent; }
input:focus-visible, .slug-row:focus-within { outline: none; border-color: var(--focus); box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus) 25%, transparent); }
.slug-row input:focus-visible { box-shadow: none; }
.hint { margin: 0; color: var(--muted); font-size: 0.8rem; }
button { min-height: 3rem; border: 0; border-radius: 999px; background: var(--brand); color: var(--brand-ink); font: inherit; font-weight: 800; font-size: 1.05rem; cursor: pointer; }
button:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
button:disabled { opacity: 0.6; }
.error { margin: 0; color: var(--bad); font-weight: 600; }
.error:empty { display: none; }
.result { margin-top: 1.2rem; padding: 1.2rem 1.4rem; border-radius: 18px; background: var(--surface); border: 1px solid var(--line); }
.result[hidden] { display: none; }
.short { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
.short a { font-size: 1.3rem; font-weight: 800; color: var(--brand); word-break: break-all; }
.short button { min-height: 2.4rem; padding: 0 1rem; font-size: 0.9rem; margin-left: auto; }
.keep { margin: 0.8rem 0 0; color: var(--muted); font-size: 0.85rem; }
.keep code { font-size: 0.8rem; word-break: break-all; color: var(--ink); }
footer { margin-top: 2rem; color: var(--muted); font-size: 0.85rem; text-align: center; }
`;

const SCRIPT = `
document.getElementById("host").textContent = location.host + "/";
const form = document.getElementById("shorten");
const error = document.getElementById("error");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.textContent = "";
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const response = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: form.url.value, slug: form.slug.value }) });
    const body = await response.json();
    if (!response.ok) { error.textContent = body.error; form.url.focus(); return; }
    const link = document.getElementById("short-link");
    link.href = body.shortUrl; link.textContent = body.shortUrl.replace(/^https?:\\/\\//, "");
    document.getElementById("token").textContent = body.token;
    document.getElementById("result").hidden = false;
    document.getElementById("copy").focus();
    form.reset();
  } catch { error.textContent = "Couldn't reach the server. Check your connection."; }
  finally { button.disabled = false; }
});
document.getElementById("copy").addEventListener("click", async (event) => {
  await navigator.clipboard.writeText(document.getElementById("short-link").href).catch(() => {});
  event.target.textContent = "Copied";
  setTimeout(() => (event.target.textContent = "Copy"), 1500);
});
`;

export const HOME_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>Fupi · short links</title>
<meta name="description" content="Make long links short, and see how many people click them.">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%236d28d9'/><path d='M13 19l6-6M11 15l-2 2a3 3 0 0 0 4 4l2-2M21 17l2-2a3 3 0 0 0-4-4l-2 2' stroke='white' stroke-width='2.4' fill='none' stroke-linecap='round'/></svg>">
<style>${STYLE}</style>
</head>
<body>
<main>
  <h1>Fupi</h1>
  <p class="lede">Make a long link short enough to text, print on a poster, or say out loud.</p>
  <form id="shorten" novalidate>
    <div class="field">
      <label for="url">Long link</label>
      <input id="url" name="url" type="url" inputmode="url" autocomplete="off" placeholder="https://tikiti.example/events/2/gengetone-block-party" required>
    </div>
    <div class="field">
      <label for="slug">Your own ending (optional)</label>
      <div class="slug-row"><span id="host">fupi.example/</span><input id="slug" name="slug" autocomplete="off" spellcheck="false" placeholder="gengetone" aria-describedby="slug-hint"></div>
      <p class="hint" id="slug-hint">3 to 30 lowercase letters, numbers and dashes. Leave it empty for a random one.</p>
    </div>
    <p class="error" id="error" role="alert"></p>
    <button type="submit">Shorten</button>
  </form>
  <section class="result" id="result" hidden aria-live="polite">
    <div class="short"><a id="short-link" href="#"></a><button type="button" id="copy">Copy</button></div>
    <p class="keep">Keep this key to see clicks or delete the link. It's shown only once:<br><code id="token"></code></p>
  </section>
  <footer>We count clicks and the site they came from. Never who you are.</footer>
</main>
<script>${SCRIPT}</script>
</body>
</html>`;

export const NOT_FOUND_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><title>Link not found · Fupi</title><style>${STYLE}</style></head>
<body><main><h1>That short link doesn't exist</h1><p class="lede">It may have been deleted, or there's a typo in it.</p><p><a href="/" style="color:var(--brand);font-weight:700">Make a short link</a></p></main></body></html>`;
