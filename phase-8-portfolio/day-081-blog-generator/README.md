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
