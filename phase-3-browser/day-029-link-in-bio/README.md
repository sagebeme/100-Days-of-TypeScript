# Day 29: Link-in-Bio Page — HTML and CSS Essentials

Watch the video: *(not recorded yet)*

## The brief

Every creator has one link in their bio that leads to all their other links: the latest drop, the YouTube channel, the M-Pesa till for orders. Today you build that page by hand, in plain HTML and CSS. No TypeScript at all.

That sounds like a step backwards, but it isn't. For the rest of Phase 3, your TypeScript runs *inside* a page like this one, and it can only find elements that the HTML actually has. You can't script a page you can't read.

```
┌──────────────────────────┐
│         (avatar)         │
│      Amina Creates       │
│  Logos · kitenge merch   │
│ ┌──────────────────────┐ │
│ │  Latest drop         │ │
│ ├──────────────────────┤ │
│ │  YouTube             │ │
│ ├──────────────────────┤ │
│ │  Order on WhatsApp   │ │
│ └──────────────────────┘ │
│   © 2026 Amina Creates   │
└──────────────────────────┘
```

## What you'll use

- The skeleton every page needs: `<!doctype html>`, `<html lang>`, `<meta charset>`, the viewport `<meta>`, `<title>`
- Semantic tags: `<header>`, `<main>`, `<nav>`, `<footer>`, one `<h1>`
- Links done properly: `https://` addresses, and `rel="noopener"` on any link that opens a new tab
- `alt` text, so a screen reader can describe your photo
- CSS custom properties (`--accent`), `max-width` to keep the page narrow on a laptop, and `:hover` / `:focus-visible` so links react

## Steps

1. Open `starter/index.html` and `starter/style.css`. Every `TODO` is one thing to add.
2. In the `<head>`: set `lang="en"` on `<html>`, add `<meta charset="utf-8">`, the viewport tag `<meta name="viewport" content="width=device-width, initial-scale=1">`, a `<title>`, and `<link rel="stylesheet" href="style.css">`.
3. In the `<header>`: an `<img>` with a real `alt`, then exactly one `<h1>` with your name, then a short `<p>` bio.
4. In `<nav>`: a `<ul class="links">` with at least three `<li><a>` links. Use real `https://` addresses. `mailto:` and `tel:` links count too.
5. Any link with `target="_blank"` needs `rel="noopener"`. Without it, the page you open gets a handle back to yours.
6. A `<footer>` at the bottom.
7. In `style.css`: define `--accent` in `:root`, use it with `var(--accent)`, give the page a `max-width`, and add a `:hover` or `:focus-visible` rule for the links.
8. Open `starter/index.html` in your browser (double-click it) and look at it. Then make the window narrow, like a phone.
9. Run the tests. They read your HTML and CSS files and check each rule above:

   ```bash
   npm test -- day-029
   ```

## Check yourself

1. What can a page opened with `target="_blank"` do to yours if the link has no `rel="noopener"`?
2. What happens on a phone if you leave out `<meta name="viewport" content="width=device-width, initial-scale=1">`?
3. Spot the bug: `<a href="www.youtube.com/@aminacreates">YouTube</a>`. Where does clicking it actually go?
4. Why use `<header>`, `<nav>`, `<main>` and `<footer>` (and exactly one `<h1>`) instead of a pile of `<div>`s that look the same?

<details><summary>Answers</summary>

1. It gets a handle back to your page (`window.opener`) and can send your tab somewhere else, for example a fake login page, while you're looking at the new one.
2. The phone pretends to be a desktop screen about 980 px wide and shrinks the whole page to fit, so the text is tiny and you have to pinch to zoom.
3. With no `https://`, it's a *relative* address: the browser looks for a folder called `www.youtube.com` next to your page and finds nothing. Links to other sites need the full `https://…`.
4. They tell the browser, search engines and screen readers what each part is. A screen-reader user can jump straight to the navigation or the main content, and the `<h1>` says what the page is about. A `<div>` means nothing.

</details>

## When you're stuck

- **The page has no styles** — the `href` in your `<link>` must match the file name exactly: `style.css`, in the same folder.
- **"expected 2 to be 1" on the `<h1>` test** — one page, one `<h1>`. Use `<h2>` for anything else.
- **The avatar test fails but you added `alt`** — `alt=""` means "this image is decoration". Your photo isn't decoration, so describe it.
- **On a phone the text is tiny** — you're missing the viewport `<meta>` tag.
- **Still stuck?** Read `solution/index.html` and `solution/style.css`, then close them and write your own from memory.
