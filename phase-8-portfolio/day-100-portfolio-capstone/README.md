# Day 100: Capstone — Your Portfolio

*A brief and a test suite. No walkthrough.*

## The brief

A hundred days ago you wrote your first TypeScript type. Since then you've built a ticketing platform, games, a route planner, a CLI, a Discord bot, and a fix to someone else's library. Today you build the thing that shows it: your portfolio site, generated from data about your projects.

```bash
node phase-8-portfolio/day-100-portfolio-capstone/starter/build.ts
npx serve phase-8-portfolio/day-100-portfolio-capstone/starter/dist
```

It's a static site, with no JavaScript sent to the browser at all. It loads instantly on a phone, works everywhere, and can be hosted free anywhere static files go.

## What's already written

- `content.ts`: a sample developer, Neema, and her projects. **Replace it with your own.**
- `theme.ts`: the design. A big name, cards for your best work, a filterable list of everything, story-shaped project pages, light and dark.
- `covers.ts`: a generated cover for each project until you have real screenshots.
- `build.ts`: writes the site into `dist/`.

## The rules (tested)

- **Checking the content** (`validateProjects`): every problem at once, each naming the project and saying what to do.
  - Slugs are lower-case words joined by dashes, and unique, because they're URLs.
  - A summary is at most 160 characters, the most search results show.
  - Links are `https://`, and every project has at least one: live or source.
  - At most 3 featured projects: when everything stands out, nothing does.
- **Organising**:
  - Featured work first, in the order you listed it, then newest first.
  - Tag pages with URL-safe slugs (`Next.js` → `next-js`). Counts treat `react` and `React` as one tag.
  - Filtering by tag and by words.
  - Related work, by shared tags.
- **The pages**:
  - Every page has one `<h1>`, a language, a title, a description, and a skip link.
  - Each project page has canonical and Open Graph tags with absolute URLs, so search engines and link previews get it right.
  - Project pages tell a story: *the problem*, *what I built*, *how it went*.
  - The current tag filter is marked with `aria-current`.
  - A sitemap and `robots.txt`, and a 404 page that search engines won't index.
  - Everything from the content is escaped.
- **It works in a sub-folder**: with `basePath: "/portfolio/"`, every link stays inside `/portfolio/`, which GitHub Pages needs for a project site.

## Making it yours

The code is the easy part. Write the content like it matters, because it's what gets read:

- **Pick three projects to feature**, the ones you'd most like to be asked about in an interview. Tikiti is a strong choice: it has a real problem, payments, security and tests.
- **Each summary is one sentence**: what it does, for whom. The tools can go at the end.
- **The story matters more than the stack.** "Fans pay by M-Pesa and send a screenshot, and someone at the gate scrolls through messages" is more memorable than "a React app".
- **Show evidence**: numbers ("under 75 KB of JavaScript", "90x faster"), links that work, and source code that's tidy with a good README.
- Replace the generated covers with real screenshots when you have them.

## Steps

1. Read the tests, then the files under "What's already written", above all the `Project` type in `site.ts` and the sample in `content.ts`.
2. `validateProjects`: every problem at once, in the words the tests expect. `npm test -- day-100 -t "checking the content"`.
3. `sortProjects`, `tagSlug`, `tagCounts`, `filterProjects` and `relatedProjects`. `npm test -- day-100 -t "organising the work"`.
4. `escapeHtml`, then `buildSite`: refuse content with problems (throw `ContentProblems`), then build the home page, a page per project and per tag, the 404 page, `sitemap.xml` and `robots.txt`, using `THEME_CSS`, `cover` and `favicon`.
5. Run the tests, then build it and look (the commands under "The brief"). Then replace `content.ts` with your own projects and ship it.

## Done when

```bash
npm test -- day-100
```

## Check yourself

1. Predict the output: `tagSlug("Next.js")`, `tagSlug("Café Life")` and `tagSlug("C++")`
2. With `basePath: "/portfolio/"` and `url: "https://you.github.io/"`, predict `href(site, "/projects/tikiti/")` and `absolute(site, "style.css")`. Why never write a bare `/` in a link?
3. Why does `validateProjects` return a list of problems instead of throwing at the first one?
4. Why at most three featured projects, and why does a project page tell *the problem*, *what I built* and *how it went* rather than list the stack?

<details><summary>Answers</summary>

1. `"next-js"`, `"cafe-life"` and `"c"`.
2. `"/portfolio/projects/tikiti/"` and `"https://you.github.io/portfolio/style.css"`. A GitHub Pages project site lives under `/portfolio/`, so a bare `/` would point outside it, at a page that isn't there.
3. You fix them all in one go instead of one build per mistake. Each problem names the project (for example `Tikiti App: slug must be lower-case words joined by dashes…`).
4. When everything stands out, nothing does. And the person reading remembers the problem you solved and how it went, not the list of tools.

</details>

## When you're stuck

- **Only the first problem is reported** — don't throw inside `validateProjects`. Push each problem onto a list, keep checking, and return them all. A project with no slug is named `project 5` (its place in the list).
- **Featured projects come out newest first** — featured ones keep the order they were listed in. Only the rest are sorted, newest year first, then by title.
- **`Café` becomes `caf`** — `normalize("NFD")` splits `é` into `e` and an accent; remove the accents before turning everything else into dashes.
- **`react` and `React` are counted apart** — count by `tagSlug(tag)`, and show the spelling you saw first.
- **A link escapes `/portfolio/`** — build every link from `basePath` (`${basePath}style.css`, `${basePath}projects/${slug}/`), and every absolute URL from `url + basePath`. Never write a bare `/`.
- **Escaping fails on one page** — escape where the text goes into the HTML, every time, including titles in `<title>`, `<meta>` content and the sitemap.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.

## Ship it

1. Put your content in, build it, and read every page on your phone.
2. Push it to GitHub. With GitHub Pages (Settings → Pages → GitHub Actions), a small workflow runs `build.ts` and publishes `dist/`. Set `url` and `basePath` to match: `https://you.github.io` with `/portfolio/`, or your own domain with `/`.
3. Check it: Lighthouse in Chrome DevTools, a link-preview checker, and a friend with a cheap phone.
4. Put the link in your CV, your GitHub profile, and your LinkedIn.

Then keep going. Every project from here on gets a page.

**Congratulations on 100 days.**
