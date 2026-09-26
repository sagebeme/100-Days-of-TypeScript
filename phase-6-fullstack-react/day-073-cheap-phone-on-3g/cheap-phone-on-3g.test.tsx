// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { luminance, contrastRatio, auditColours, accessibleName, auditDocument } from "./starter/audit.ts";
import { light, dark, PAIRS } from "./starter/tokens.ts";
import { TicketPage } from "./starter/TicketPage.tsx";

afterEach(cleanup);
const starter = join(import.meta.dirname, "starter");
const html = (markup: string) => new DOMParser().parseFromString(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width"></head><body>${markup}<h1>Page</h1></body></html>`, "text/html");
const rules = (markup: string) => auditDocument(html(markup)).map((p) => p.rule);
// "No problems found" only means something if the audit can find problems.
const auditWorks = () => {
  expect(rules(`<img src="a.jpg">`).length, "auditDocument isn't finding anything yet").toBeGreaterThan(0);
  expect(auditColours({ a: "#fff", b: "#fff" }, [{ fg: "a", bg: "b" }]).length, "auditColours isn't finding anything yet").toBe(1);
};

describe("contrast", () => {
  it("measures brightness the way eyes do", () => {
    expect(luminance("#000000")).toBe(0);
    expect(luminance("#ffffff")).toBe(1);
    expect(luminance("#fff")).toBe(1);
    expect(luminance("#00ff00")).toBeGreaterThan(luminance("#ff0000")); // green looks brighter than red
    expect(luminance("#777777")).toBeCloseTo(0.1845, 3);
    expect(() => luminance("orange")).toThrow();
  });

  it("works out WCAG contrast ratios", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 5); // order doesn't matter
    expect(contrastRatio("#c2410c", "#c2410c")).toBe(1);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2); // the palest grey that passes on white
  });

  it("reports every pair that's too pale, and lets large text off more lightly", () => {
    const palette = { ink: "#1b1722", paper: "#ffffff", pale: "#a8a29e" };
    expect(auditColours(palette, [{ fg: "ink", bg: "paper" }])).toEqual([]);
    expect(auditColours(palette, [{ fg: "pale", bg: "paper" }])).toEqual([{ rule: "contrast", message: "pale on paper is 2.52:1, needs 4.5:1" }]);
    expect(auditColours({ a: "#949494", b: "#ffffff" }, [{ fg: "a", bg: "b", large: true }])).toEqual([]);
  });

  it("finds nothing wrong with the page's colours, in light mode or dark", () => {
    auditWorks();
    expect(auditColours(light, PAIRS)).toEqual([]);
    expect(auditColours(dark, PAIRS)).toEqual([]);
  });
});

describe("accessible names", () => {
  it("come from the right place", () => {
    const doc = html(`
      <button id="a"><svg aria-hidden="true"></svg></button>
      <button id="b" aria-label="Share this event"><svg aria-hidden="true"></svg></button>
      <span id="t">Buy</span><button id="c" aria-labelledby="t"></button>
      <a id="d" href="/"><img alt="Tikiti home" /></a>
      <label for="e">Email</label><input id="e" />
      <label>Phone <input id="f" /></label>
      <input id="g" placeholder="Your email" />`);
    const name = (id: string) => accessibleName(doc.getElementById(id)!);
    expect(["a", "b", "c", "d", "e", "f", "g"].map(name)).toEqual(["", "Share this event", "Buy", "Tikiti home", "Email", "Phone", ""]);
  });
});

describe("the audit", () => {
  it("finds a missing lang, a zoom lock, and a stylesheet from another server", () => {
    const doc = new DOMParser().parseFromString(
      `<html><head><meta name="viewport" content="width=device-width, user-scalable=no"><link rel="stylesheet" href="https://fonts.example/css"></head><body><h1>Hi</h1></body></html>`,
      "text/html",
    );
    expect(auditDocument(doc).map((p) => p.rule)).toEqual(["html-lang", "viewport", "render-blocking"]);
    expect(rules("")).toEqual([]);
  });

  it("checks images: alt text, a size, and lazy loading unless it's the main one", () => {
    expect(rules(`<img src="a.jpg">`)).toEqual(["img-alt", "img-size", "img-lazy"]);
    expect(rules(`<img src="a.jpg" alt="" width="10" height="10" loading="lazy">`)).toEqual([]);
    expect(rules(`<img src="a.jpg" alt="Poster" width="10" height="10" fetchpriority="high">`)).toEqual([]);
  });

  it("wants every control labelled and every button named", () => {
    expect(rules(`<input placeholder="Your email">`)).toEqual(["label"]);
    expect(rules(`<input type="hidden"><input type="submit" value="Go">`)).toEqual([]);
    expect(rules(`<button><svg aria-hidden="true"></svg></button>`)).toEqual(["name"]);
    expect(rules(`<a href="/"></a>`)).toEqual(["name"]);
  });

  it("checks the heading outline and the tab order", () => {
    expect(rules(`<h2>A</h2><h4>B</h4>`)).toEqual(["headings"]);
    expect(rules(`<h2>A</h2><h3>B</h3><h2>C</h2>`)).toEqual([]);
    expect(auditDocument(new DOMParser().parseFromString(`<html lang="en"><head><meta name="viewport" content="width=device-width"></head><body><h2>No h1</h2></body></html>`, "text/html")).map((p) => p.rule)).toEqual(["headings"]);
    expect(rules(`<div tabindex="1">Buy</div>`)).toEqual(["tabindex"]);
    expect(rules(`<div tabindex="0">x</div><div tabindex="-1">y</div>`)).toEqual([]);
  });
});

describe("the ticket page", () => {
  it("passes the audit: its HTML shell", async () => {
    auditWorks();
    const shell = new DOMParser().parseFromString(await readFile(join(starter, "index.html"), "utf8"), "text/html");
    shell.body.innerHTML = "<h1>Page</h1>"; // the body is React's; it's checked next
    expect(auditDocument(shell)).toEqual([]);
  });

  it("passes the audit: what React draws", () => {
    auditWorks();
    render(<TicketPage />);
    document.documentElement.lang = "en";
    document.head.innerHTML = `<meta name="viewport" content="width=device-width, initial-scale=1">`;
    expect(auditDocument(document)).toEqual([]);
  });

  it("can be bought with a keyboard: Buy is a real button", async () => {
    render(<TicketPage />);
    expect(screen.getByRole("button", { name: "Buy tickets" }).tagName).toBe("BUTTON");
    const save = screen.getByRole("button", { name: "Save to favourites" });
    expect(save.getAttribute("aria-pressed")).toBe("false");
    await userEvent.click(save);
    expect(save.getAttribute("aria-pressed")).toBe("true");
  });

  it("loads the seat map only when it's asked for", { timeout: 20_000 }, async () => {
    render(<TicketPage />);
    expect(screen.queryByRole("heading", { name: /Seat map/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Choose your seat" }));
    // The seat map is a separate download: give it time, as a slow phone would need to.
    expect(await screen.findByRole("heading", { name: /Seat map/ }, { timeout: 15_000 })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hide the seat map" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("respects people who ask for less motion, uses the phone's fonts, and big enough boxes", async () => {
    const css = await readFile(join(starter, "style.css"), "utf8");
    const withoutMotionQueries = css.replace(/@media \(prefers-reduced-motion[^{]*\{[\s\S]*?\n\}/g, "");
    expect(withoutMotionQueries).not.toMatch(/animation:\s*(?!none)/); // animations only inside a motion query
    expect(css).toMatch(/system-ui/);
    expect(css).not.toMatch(/Poppins/);
    expect(css).toMatch(/\.icon-button \{[^}]*width: 2\.75rem/);
    expect(css).not.toMatch(/font-size: 0\.8rem/); // inputs under 16px make phones zoom in
  });
});

describe("the download", { timeout: 60_000 }, () => {
  it("keeps the seat map out of the first download, and the first download under budget", async () => {
    const { build } = await import("vite");
    // A production build, as a phone would download it (tests run with NODE_ENV=test, which would
    // bundle React's much bigger development build).
    const result = await build({
      root: starter,
      configFile: join(starter, "vite.config.ts"),
      mode: "production",
      define: { "process.env.NODE_ENV": JSON.stringify("production") },
      logLevel: "silent",
      build: { write: false },
    });
    const output = (Array.isArray(result) ? result[0] : result) as { output: { type: string; isEntry?: boolean; fileName: string; code?: string }[] };
    const chunks = output.output.filter((o) => o.type === "chunk");
    const entry = chunks.find((c) => c.isEntry)!;
    const lazy = chunks.filter((c) => !c.isEntry);

    expect(entry.code).not.toContain("KASARANI-SEATING-V1");
    expect(lazy.some((c) => c.code?.includes("KASARANI-SEATING-V1"))).toBe(true);
    // React itself is about 60 KB gzipped; the page adds about 10. With the seat map in, it's over 80.
    const kb = gzipSync(entry.code!).length / 1024;
    expect(kb).toBeLessThan(75);
  });
});
