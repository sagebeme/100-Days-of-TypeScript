// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const html = readFileSync(join(import.meta.dirname, "starter", "index.html"), "utf8");
const rawCss = readFileSync(join(import.meta.dirname, "starter", "style.css"), "utf8");
// Comments don't count: a TODO that mentions max-width isn't a max-width rule.
const css = rawCss.replace(/\/\*[\s\S]*?\*\//g, "");

const page = new DOMParser().parseFromString(html, "text/html");
const links = [...page.querySelectorAll<HTMLAnchorElement>(".links a")];

describe("the <head>", () => {
  it("sets the page language", () => {
    expect(page.documentElement.getAttribute("lang")).toBeTruthy();
  });

  it("declares utf-8", () => {
    expect(page.querySelector("meta[charset]")?.getAttribute("charset")?.toLowerCase()).toBe("utf-8");
  });

  it("has a viewport tag that uses the device width", () => {
    const content = page.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "";
    expect(content).toContain("width=device-width");
  });

  it("has a title", () => {
    expect(page.querySelector("title")?.textContent?.trim()).toBeTruthy();
  });

  it("links style.css", () => {
    expect(page.querySelector('link[rel="stylesheet"]')?.getAttribute("href")).toBe("style.css");
  });
});

describe("the page body", () => {
  it("has exactly one <h1>, and it is not empty", () => {
    const headings = page.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    expect(headings[0].textContent?.trim()).toBeTruthy();
  });

  it("has an avatar image in the header that describes itself", () => {
    const img = page.querySelector("header img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("alt")?.trim()).toBeTruthy();
  });

  it("has the links inside <nav>", () => {
    expect(page.querySelector("nav ul.links")).not.toBeNull();
  });

  it("has a footer", () => {
    expect(page.querySelector("footer")).not.toBeNull();
  });
});

describe("the links", () => {
  it("has at least three, each with visible text", () => {
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of links) {
      expect(link.textContent?.trim()).toBeTruthy();
    }
  });

  it("uses https, mailto or tel for every link", () => {
    for (const link of links) {
      expect(link.getAttribute("href") ?? "").toMatch(/^(https:\/\/|mailto:|tel:)/);
    }
  });

  it('adds rel="noopener" to every link that opens a new tab', () => {
    for (const link of links.filter((l) => l.getAttribute("target") === "_blank")) {
      expect(link.getAttribute("rel") ?? "").toContain("noopener");
    }
  });
});

describe("style.css", () => {
  it("defines --accent in :root", () => {
    expect(css).toMatch(/:root\s*{[^}]*--accent\s*:/);
  });

  it("uses var(--accent)", () => {
    expect(css).toContain("var(--accent)");
  });

  it("keeps the page narrow with max-width", () => {
    expect(css).toMatch(/max-width\s*:/);
  });

  it("styles links on hover or keyboard focus", () => {
    expect(css).toMatch(/:hover|:focus-visible/);
  });
});
