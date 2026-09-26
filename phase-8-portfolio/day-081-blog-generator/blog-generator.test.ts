import { describe, it, expect } from "vitest";
import { markdownToHtml, inline, escapeHtml, plainText } from "./starter/markdown.ts";
import { parseFrontMatter, parsePost, slugify, readingMinutes, type Post } from "./starter/posts.ts";
import { buildSite, rss, published, formatDate } from "./starter/site.ts";

const config = { title: "Matatu Diaries", description: "Notes on Nairobi.", url: "https://matatu-diaries.example", author: "Amina" };
const post = (overrides: Partial<Post> = {}): Post => ({
  slug: "first-ride",
  title: "First Ride",
  date: "2026-10-03",
  tags: ["nairobi"],
  summary: "It was loud.",
  draft: false,
  html: "<p>It was loud.</p>",
  readingMinutes: 1,
  ...overrides,
});

describe("markdown", () => {
  it("turns blocks into HTML", () => {
    expect(markdownToHtml("# Title\n\nFirst line\nsecond line.\n\n## Sub")).toBe("<h1>Title</h1>\n<p>First line second line.</p>\n<h2>Sub</h2>");
    expect(markdownToHtml("- one\n- two\n\n1. first\n2. second")).toBe("<ul><li>one</li><li>two</li></ul>\n<ol><li>first</li><li>second</li></ol>");
    expect(markdownToHtml("> quoted\n> more")).toBe("<blockquote><p>quoted more</p></blockquote>");
    expect(markdownToHtml("above\n\n---\n\nbelow")).toBe("<p>above</p>\n<hr>\n<p>below</p>");
  });

  it("keeps code exactly as written, escaped, with its language", () => {
    expect(markdownToHtml("```ts\nconst a = 1 < 2 && **not bold**;\n```")).toBe('<pre><code class="language-ts">const a = 1 &lt; 2 &amp;&amp; **not bold**;</code></pre>');
  });

  it("does inline bold, emphasis, code, links and images", () => {
    expect(inline("**bold**, *em* and `x < y`")).toBe("<strong>bold</strong>, <em>em</em> and <code>x &lt; y</code>");
    expect(inline("[guide](https://example.com/a?b=1&c=2)")).toBe('<a href="https://example.com/a?b=1&amp;c=2">guide</a>');
    expect(inline("![a matatu](/img/matatu.jpg)")).toBe('<img src="/img/matatu.jpg" alt="a matatu" loading="lazy">');
    expect(inline("`**stays literal**`")).toBe("<code>**stays literal**</code>");
  });

  it("can't be used to run scripts", () => {
    expect(markdownToHtml("<script>alert(1)</script>")).toBe("<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
    expect(inline('[click](javascript:alert(1))')).not.toContain("href");
    expect(inline('[x](" onmouseover="alert(1))')).not.toContain('onmouseover="');
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });

  it("gives plain text for summaries and word counts", () => {
    expect(plainText("## Hi\n\n1. **Mama Njeri's**: ribs\n- see [the guide](https://x.example)\n\n```\ncode\n```")).toBe("Hi Mama Njeri's: ribs see the guide");
  });
});

describe("posts", () => {
  it("reads front matter: text, lists and true/false", () => {
    expect(parseFrontMatter('---\ntitle: "Hello: world"\ntags: [food, nairobi]\ndraft: true\n---\nBody')).toEqual({
      data: { title: "Hello: world", tags: ["food", "nairobi"], draft: true },
      body: "Body",
    });
    expect(parseFrontMatter("No front matter")).toEqual({ data: {}, body: "No front matter" });
  });

  it("makes URL-safe slugs", () => {
    expect(slugify("Nairobi's Best Nyama Choma (2026)!")).toBe("nairobis-best-nyama-choma-2026");
    expect(slugify("  Café — Ümlauts  ")).toBe("cafe-umlauts");
  });

  it("works out reading time at 200 words a minute, at least 1", () => {
    expect(readingMinutes("word ".repeat(10))).toBe(1);
    expect(readingMinutes("word ".repeat(201))).toBe(2);
    expect(readingMinutes("")).toBe(1);
  });

  it("turns a file into a post", () => {
    const p = parsePost("ride.md", "---\ntitle: First Ride!\ndate: 2026-10-03\ntags: [Nairobi, Transport]\n---\n\n# Hello\n\nIt was **loud**.");
    expect(p).toEqual({
      slug: "first-ride",
      title: "First Ride!",
      date: "2026-10-03",
      tags: ["nairobi", "transport"],
      summary: "Hello It was loud.",
      draft: false,
      html: "<h1>Hello</h1>\n<p>It was <strong>loud</strong>.</p>",
      readingMinutes: 1,
    });
  });

  it("uses a given summary, or cuts a long one at a word", () => {
    expect(parsePost("a.md", "---\ntitle: A\ndate: 2026-01-01\nsummary: Short.\n---\nLong body").summary).toBe("Short.");
    const long = parsePost("a.md", `---\ntitle: A\ndate: 2026-01-01\n---\n${"matatu ".repeat(50)}`).summary;
    expect(long.length).toBeLessThanOrEqual(160);
    expect(long.endsWith("matatu…")).toBe(true);
  });

  it("refuses a post without a proper date", () => {
    expect(() => parsePost("oops.md", "---\ntitle: Oops\ndate: next week\n---\nx")).toThrow(/oops\.md.*date/);
  });
});

describe("the site", () => {
  const posts = [
    post(),
    post({ slug: "nyama", title: "Nyama Choma", date: "2026-11-14", tags: ["nairobi", "food"] }),
    post({ slug: "secret", title: "Secret", date: "2026-12-13", draft: true }),
  ];

  it("shows published posts, newest first", () => {
    expect(published(posts).map((p) => p.slug)).toEqual(["nyama", "first-ride"]);
    expect(formatDate("2026-11-14")).toBe("14 November 2026");
  });

  it("has an index, a page per post, a page per tag, a feed and a stylesheet, and nothing for drafts", () => {
    const files = buildSite(posts, config);
    expect([...files.keys()].sort()).toEqual(["feed.xml", "index.html", "posts/first-ride/index.html", "posts/nyama/index.html", "style.css", "tags/food/index.html", "tags/nairobi/index.html"]);
    const index = files.get("index.html")!;
    expect(index.indexOf("Nyama Choma")).toBeLessThan(index.indexOf("First Ride"));
    expect(index).not.toContain("Secret");
    expect(files.get("tags/food/index.html")).toContain("Nyama Choma");
    expect(files.get("tags/food/index.html")).not.toContain("First Ride");
  });

  it("makes real, linked pages", () => {
    const page = buildSite(posts, config).get("posts/nyama/index.html")!;
    expect(page).toMatch(/^<!doctype html>/);
    expect(page).toContain('<html lang="en">');
    expect(page).toContain("<title>Nyama Choma · Matatu Diaries</title>");
    expect(page).toContain('<link rel="stylesheet" href="../../style.css">');
    expect(page).toContain('<a href="../../tags/food/index.html">#food</a>');
    expect(page).toContain('<link rel="canonical" href="https://matatu-diaries.example/posts/nyama/">');
    expect(page).toContain('<time datetime="2026-11-14">14 November 2026</time>');
  });

  it("escapes titles everywhere", () => {
    const files = buildSite([post({ title: "<b>Loud</b> & proud" })], config);
    expect(files.get("index.html")).toContain("&lt;b&gt;Loud&lt;/b&gt; &amp; proud");
    expect(files.get("feed.xml")).toContain("<title>&lt;b&gt;Loud&lt;/b&gt; &amp; proud</title>");
  });

  it("refuses two posts that would land on the same page", () => {
    expect(() => buildSite([post(), post({ title: "Another" })], config)).toThrow(/posts\/first-ride/);
  });
});

describe("the feed", () => {
  it("is RSS 2.0 with the latest posts", () => {
    const feed = rss([post(), post({ slug: "nyama", title: "Nyama Choma", date: "2026-11-14" })], config);
    expect(feed).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<rss version="2.0">/);
    expect(feed).toContain("<link>https://matatu-diaries.example/posts/nyama/</link>");
    expect(feed).toContain("<pubDate>Sat, 14 Nov 2026 12:00:00 GMT</pubDate>");
    expect(feed.indexOf("Nyama Choma")).toBeLessThan(feed.indexOf("First Ride"));
  });

  it("keeps only the 20 newest", () => {
    const many = Array.from({ length: 25 }, (_, i) => post({ slug: `p${i}`, title: `P${i}`, date: `2026-01-${String(i + 1).padStart(2, "0")}` }));
    expect(rss(many, config).match(/<item>/g)).toHaveLength(20);
  });
});
