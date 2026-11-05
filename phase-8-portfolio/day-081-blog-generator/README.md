# Day 81: Blog Generator

*Phase 8 has no walkthrough: a brief, a test suite, and you. Read the brief, read the tests, build it.*

## The brief

Build a static site generator for a blog. Write posts as Markdown files; run one command; get a folder of plain HTML you can put on any free host (GitHub Pages, Netlify, Cloudflare Pages). No database, no server, nothing to hack.

```
posts/first-matatu-ride.md   ─┐
posts/nyama-choma.md          ├──→  dist/index.html
posts/gengetone-playlist.md   │     dist/posts/my-first-matatu-ride-explained/index.html
posts/draft-review.md (draft) ┘     dist/tags/nairobi/index.html
                                     dist/feed.xml
                                     dist/style.css
```

A post is a Markdown file with front matter:

```markdown
---
title: My First Matatu Ride, Explained
date: 2026-10-03
tags: [nairobi, transport]
summary: Graffiti, bass you can feel in your teeth, and a conductor who counts change faster than a calculator.
---

The first time I took a matatu from town to Rongai, I got on the wrong one. **Twice.**
```

## What it must do

- **Markdown**: headings, paragraphs (lines joined), lists (bulleted and numbered), block quotes, horizontal rules, fenced code with a language, and inline **bold**, *emphasis*, `code`, links and images.
- **Safety**: every piece of text is HTML-escaped. A post can't inject a `<script>`, and links only go to `http(s)`, `mailto` or relative paths. `javascript:` links lose their link.
- **Posts**: front matter (text, `[lists]`, `true`/`false`), a slug from the title, reading time at 200 words a minute (at least 1), and a summary (the given one, or the start of the text cut at a word, at most 160 characters). A post without a real `YYYY-MM-DD` date is an error that names the file.
- **The site**: an index of published posts, newest first; a page per post; a page per tag; an RSS 2.0 feed of the 20 newest; and a stylesheet. Drafts appear nowhere. Two posts with the same slug is an error.
- **Real pages**: `lang`, a title like `Nyama Choma · Matatu Diaries`, a canonical URL, relative links that work from any folder, and `<time datetime>`.

`theme.ts` has a reading theme you can use, or replace with your own. `build.ts` runs it all.

## Steps

1. Read the tests, then the four posts in `starter/posts/` (one is a draft). `build.ts` is already written.
2. `markdown.ts`: `escapeHtml`, then `inline`, then `markdownToHtml` one kind of block at a time, then `plainText`. `npm test -- day-081 -t markdown`.
3. `posts.ts`: `parseFrontMatter`, `slugify`, `readingMinutes`, then `parsePost`.
4. `site.ts`: `published` and `formatDate`, then `rss`, then `buildSite`.
5. Run the tests, build the real posts, and look at the result (the commands under "Done when").

## Done when

```bash
npm test -- day-081
node phase-8-portfolio/day-081-blog-generator/starter/build.ts
npx vite preview --outDir phase-8-portfolio/day-081-blog-generator/starter/dist   # have a look
```

## Stretch

- Syntax highlighting for code blocks, at build time: no JavaScript sent to readers.
- "Next and previous post" links at the bottom of each post.
- Publish it for real, and send the link to someone.

## When you're stuck

- **`**bold**` gets turned into `<strong>` inside backticks** — take the code spans out first (swap each for a placeholder), do bold, emphasis and links on what's left, then put the code back.
- **The link test with `&` fails, or `onmouseover="` gets through** — escape the whole line first, then build the tags. A URL is checked against the allowed starts (`http(s):`, `mailto:`, a relative path) and anything else keeps only its text.
- **`Café` becomes `caf`** — `normalize("NFKD")` splits `é` into `e` plus an accent; drop the accents (`\p{M}`) before throwing away everything that isn't a letter or digit.
- **Dates come out a day early, or `pubDate` isn't `12:00:00 GMT`** — `new Date("2026-11-14")` is midnight UTC, which is the day before in some time zones. Read the date as noon UTC (`T12:00:00Z`) and format it in UTC.
- **The stylesheet doesn't load on a post page** — a post is two folders deep (`posts/<slug>/index.html`), so its links start with `../../`. The index's start with nothing.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
