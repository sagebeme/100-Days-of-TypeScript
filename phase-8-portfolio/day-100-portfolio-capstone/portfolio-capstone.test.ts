import { describe, it, expect } from "vitest";
import { projects as sample, site } from "./starter/content.ts";
import {
  buildSite,
  ContentProblems,
  escapeHtml,
  filterProjects,
  relatedProjects,
  sortProjects,
  tagCounts,
  tagSlug,
  validateProjects,
  type Project,
  type SiteConfig,
} from "./starter/site.ts";

const base = {
  slug: "neno",
  title: "Neno",
  summary: "A daily five-letter word game in Kiswahili, with streaks.",
  year: 2026,
  tags: ["TypeScript", "Games"],
  links: { live: "https://neno.example" },
  problem: "Wordle, in Kiswahili.",
  approach: "Scoring that handles double letters.",
  result: "Played daily.",
};
const make = (overrides: Record<string, unknown>) => ({ ...base, ...overrides });
const valid = (raw: unknown[]) => {
  const { projects, problems } = validateProjects(raw);
  expect(problems).toEqual([]);
  return projects;
};

describe("checking the content", () => {
  it("accepts a good project, filling in the defaults", () => {
    expect(valid([base])[0]).toMatchObject({ slug: "neno", featured: false, highlights: [] });
  });

  it("says which project, and what to do, for each problem at once", () => {
    const { projects, problems } = validateProjects([
      make({ slug: "Bad Slug" }),
      make({ slug: "long", summary: "x".repeat(172) }),
      make({ slug: "nolinks", links: {} }),
      make({ slug: "insecure", links: { source: "http://github.com/x" } }),
      { title: "No slug at all" },
    ]);
    expect(projects).toEqual([]);
    expect(problems).toContain('Bad Slug: slug must be lower-case words joined by dashes, like "matatu-routes"');
    expect(problems).toContain("long: summary is 172 characters: keep it to 160, or search results cut it off");
    expect(problems.find((p) => p.startsWith("nolinks:"))).toContain("give at least one link: live or source");
    expect(problems.find((p) => p.startsWith("insecure:"))).toContain("must be an https:// address");
    expect(problems.filter((p) => p.startsWith("project 5:")).length).toBeGreaterThanOrEqual(3);
  });

  it("refuses two projects with the same slug: slugs are URLs", () => {
    expect(validateProjects([base, make({ title: "Neno 2" })]).problems).toEqual(['"neno" is used by two projects: slugs are URLs, so they must be unique']);
  });

  it("keeps the featured projects to a few, so they stand out", () => {
    const four = ["a", "b", "c", "d"].map((slug) => make({ slug, featured: true }));
    expect(validateProjects(four).problems).toEqual(["feature at most 3 projects: 4 are featured, and when everything stands out nothing does"]);
  });

  it("the sample content has no problems", () => {
    expect(validateProjects(sample).problems).toEqual([]);
  });
});

describe("organising the work", () => {
  const projects = () => valid([
    make({ slug: "old", title: "Old", year: 2024 }),
    make({ slug: "b-new", title: "B New", year: 2026 }),
    make({ slug: "a-new", title: "A New", year: 2026 }),
    make({ slug: "star-2", title: "Star Two", featured: true, year: 2025 }),
    make({ slug: "star-1", title: "Star One", featured: true, year: 2024 }),
  ]);

  it("puts featured work first, in the order you listed it, then the newest", () => {
    expect(sortProjects(projects()).map((p) => p.slug)).toEqual(["star-2", "star-1", "a-new", "b-new", "old"]);
  });

  it("makes tags into URL-safe slugs", () => {
    expect(["Next.js", "Open source", "M-Pesa", "Node.js ", "Café"].map(tagSlug)).toEqual(["next-js", "open-source", "m-pesa", "node-js", "cafe"]);
  });

  it("counts tags, most used first, treating 'react' and 'React' as one", () => {
    const tagged = valid([make({ slug: "a", tags: ["React", "Vite"] }), make({ slug: "b", tags: ["react", "Hono"] }), make({ slug: "c", tags: ["Hono", "React"] })]);
    expect(tagCounts(tagged)).toEqual([
      { tag: "React", slug: "react", count: 3 },
      { tag: "Hono", slug: "hono", count: 2 },
      { tag: "Vite", slug: "vite", count: 1 },
    ]);
  });

  it("filters by tag and by words anywhere in the title, summary or tags", () => {
    const all = valid(sample);
    expect(filterProjects(all, { tag: "next-js" }).map((p) => p.slug)).toEqual(["tikiti"]);
    expect(filterProjects(all, { tag: "Next.js" }).map((p) => p.slug)).toEqual(["tikiti"]);
    expect(filterProjects(all, { query: "m-pesa" }).map((p) => p.slug)).toEqual(["tikiti", "trip-splitter"]);
    expect(filterProjects(all, { query: "KISWAHILI game" }).map((p) => p.slug)).toEqual(["neno"]);
    expect(filterProjects(all, { tag: "security", query: "discord" }).map((p) => p.slug)).toEqual(["tikiti-bot"]);
    expect(filterProjects(all, {})).toHaveLength(all.length);
  });

  it("finds related work by shared tags, never the project itself", () => {
    const all = valid(sample);
    const tikiti = all.find((p) => p.slug === "tikiti")!;
    const related = relatedProjects(tikiti, all);
    expect(related.map((p) => p.slug)).not.toContain("tikiti");
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related[0].slug).toBe("fupi"); // shares Hono and SQLite
    const loner = valid([make({ slug: "x", tags: ["Rust"] }), base])[0];
    expect(relatedProjects(loner, [loner, valid([base])[0]])).toEqual([]);
  });
});

describe("the built site", () => {
  let built: Map<string, string> | undefined;
  const site_ = () => (built ??= buildSite(site, sample));
  const page = (path: string) => {
    const files = site_();
    const html = files.get(path);
    if (!html) throw new Error(`no ${path}; built: ${[...files.keys()].join(", ")}`);
    return html;
  };

  it("has a page for every project and tag, plus the files hosts and search engines look for", () => {
    const files = site_();
    for (const p of sample as { slug: string }[]) expect(files.has(`projects/${p.slug}/index.html`)).toBe(true);
    for (const t of tagCounts(valid(sample))) expect(files.has(`tags/${t.slug}/index.html`)).toBe(true);
    for (const f of ["index.html", "404.html", "sitemap.xml", "robots.txt", "style.css", "favicon.svg"]) expect(files.has(f), f).toBe(true);
  });

  it("gives every page one h1, a language, a title and a description", () => {
    for (const [path, html] of site_()) {
      if (!path.endsWith(".html")) continue;
      expect(html.match(/<h1[\s>]/g), path).toHaveLength(1);
      expect(html, path).toContain('<html lang="en">');
      expect(html, path).toMatch(/<title>[^<]+<\/title>/);
      expect(html, path).toMatch(/<meta name="description" content="[^"]{10,}">/);
      expect(html, path).toContain('<a class="skip" href="#main">');
    }
  });

  it("describes each project for search results and link previews, with absolute URLs", () => {
    const html = page("projects/tikiti/index.html");
    expect(html).toContain("<title>Tikiti · Neema Wambui</title>");
    expect(html).toContain('<link rel="canonical" href="https://neema.example/projects/tikiti/">');
    expect(html).toContain('<meta property="og:url" content="https://neema.example/projects/tikiti/">');
    expect(html).toContain('<meta property="og:type" content="article">');
    expect(html).toContain('<meta property="og:title" content="Tikiti">');
    expect(html).toContain('href="https://tikiti.example"');
    expect(html).toContain('href="/tags/next-js/"');
  });

  it("tells the story: problem, what was built, how it went", () => {
    const html = page("projects/matatu-routes/index.html");
    expect(html.indexOf("The problem")).toBeLessThan(html.indexOf("What I built"));
    expect(html.indexOf("What I built")).toBeLessThan(html.indexOf("How it went"));
    expect(html).toContain("Dijkstra over (stage, route) pairs");
  });

  it("marks the current tag in the filters, for screen readers too", () => {
    const html = page("tags/typescript/index.html");
    expect(html).toMatch(/<a href="\/tags\/typescript\/" aria-current="page">TypeScript <span>5<\/span><\/a>/);
    expect(page("index.html")).toMatch(/<a href="\/#all" aria-current="page">All <span>8<\/span><\/a>/);
  });

  it("works under a sub-folder, as on GitHub Pages", () => {
    const hosted: SiteConfig = { ...site, url: "https://neema.github.io", basePath: "/portfolio/" };
    const sub = buildSite(hosted, sample);
    const html = sub.get("projects/neno/index.html")!;
    expect(html).toContain('href="/portfolio/style.css"');
    expect(html).toContain('<link rel="canonical" href="https://neema.github.io/portfolio/projects/neno/">');
    expect(html).not.toMatch(/href="\/(?!portfolio\/)/); // no link escapes the folder
    expect(sub.get("sitemap.xml")).toContain("<loc>https://neema.github.io/portfolio/tags/games/</loc>");
  });

  it("lists every page in the sitemap, and points robots.txt at it", () => {
    const xml = page("sitemap.xml");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml.match(/<loc>/g)).toHaveLength(1 + sample.length + tagCounts(valid(sample)).length);
    expect(xml).toContain("<loc>https://neema.example/</loc>");
    expect(xml).not.toContain("404");
    expect(page("robots.txt")).toContain("Sitemap: https://neema.example/sitemap.xml");
  });

  it("keeps the 404 page out of search results", () => {
    expect(page("404.html")).toContain('<meta name="robots" content="noindex">');
    expect(page("404.html")).not.toContain('rel="canonical"');
  });

  it("escapes everything that comes from the content", () => {
    expect(escapeHtml(`<b>"Tom" & 'Jerry'</b>`)).toBe("&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;");
    const sneaky = buildSite({ ...site, name: "Neema <script>alert(1)</script>" }, [make({ title: "<img src=x onerror=alert(1)>", summary: 'A "quoted" summary that is long enough.' })]);
    for (const html of sneaky.values()) {
      expect(html).not.toContain("<script>alert");
      expect(html).not.toContain("<img src=x");
    }
    expect(sneaky.get("projects/neno/index.html")).toContain('content="A &quot;quoted&quot; summary that is long enough."');
  });

  it("sends no JavaScript at all", () => {
    for (const [path, html] of site_()) if (path.endsWith(".html")) expect(html, path).not.toMatch(/<script/i);
  });

  it("refuses to build from content with problems, listing them", () => {
    expect(() => buildSite(site, [make({ slug: "x", links: {} })])).toThrow(ContentProblems);
    try {
      buildSite(site, [make({ slug: "x", links: {} })]);
    } catch (error) {
      expect((error as ContentProblems).problems[0]).toContain("give at least one link");
    }
  });
});

// Keeps the Project type in use, so the tests fail to compile if its shape drifts.
export type _Check = Project["links"];
