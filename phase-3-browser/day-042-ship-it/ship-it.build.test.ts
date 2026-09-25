import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { build } from "vite";
import { Window } from "happy-dom";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Kilobytes of JavaScript a player downloads before the game can start. Rider Rush needs far
// less; the budget is there so a careless import (a whole library for one function) gets noticed.
const JS_BUDGET_KB = 50;

let outDir: string;
let page: Document;

// Builds the game exactly as `npx vite build` would (with your vite.config.ts), into a temp folder.
beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), "rider-rush-build-"));
  await build({
    root: join(import.meta.dirname, "starter"),
    logLevel: "silent",
    build: { outDir, emptyOutDir: true },
  });
  const window = new Window({
    settings: { disableCSSFileLoading: true, disableJavaScriptFileLoading: true, handleDisabledFileLoadingAsSuccess: true },
  });
  const html = await readFile(join(outDir, "index.html"), "utf8");
  page = new window.DOMParser().parseFromString(html, "text/html") as unknown as Document;
}, 60_000);

afterAll(async () => {
  await rm(outDir, { recursive: true, force: true });
});

const meta = (selector: string) => page.querySelector(selector)?.getAttribute("content") ?? "";
const linkHref = (rel: string) => page.querySelector(`link[rel="${rel}"]`)?.getAttribute("href") ?? "";
const inBuild = (path: string) => existsSync(join(outDir, path));

describe("paths", () => {
  it("makes every local link relative, so the game works in any folder", () => {
    const addresses = [...page.querySelectorAll("[src], [href]")]
      .map((element) => element.getAttribute("src") ?? element.getAttribute("href") ?? "")
      .filter((address) => !/^(https?:|data:|#)/.test(address));
    expect(addresses.length).toBeGreaterThan(0);
    for (const address of addresses) {
      expect(address, `${address} starts with "/"`).not.toMatch(/^\//);
    }
  });

  it("points at files that are really in the build", () => {
    for (const rel of ["icon", "apple-touch-icon", "manifest"]) {
      const href = linkHref(rel);
      expect(href, `<link rel="${rel}">`).not.toBe("");
      expect(inBuild(href), `${href} for rel="${rel}"`).toBe(true);
    }
  });
});

describe("link previews", () => {
  it("has a description", () => {
    expect(meta('meta[name="description"]').length).toBeGreaterThan(30);
  });

  it("colours the browser bar on phones", () => {
    expect(meta('meta[name="theme-color"]')).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("has Open Graph tags for the preview card", () => {
    expect(meta('meta[property="og:type"]')).toBe("website");
    expect(meta('meta[property="og:title"]')).not.toBe("");
    expect(meta('meta[property="og:description"]')).not.toBe("");
    expect(meta('meta[property="og:image"]')).toMatch(/og-image\.png$/);
    expect(meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  });

  it("ships the preview image", () => {
    expect(inBuild("og-image.png")).toBe(true);
  });
});

describe("the web app manifest", () => {
  it("lets phones install the game", async () => {
    const manifest = JSON.parse(await readFile(join(outDir, linkHref("manifest")), "utf8"));
    expect(manifest.name).toBe("Rider Rush");
    expect(manifest.short_name.length).toBeLessThanOrEqual(12);
    expect(manifest.start_url).toBe(".");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i);

    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    for (const icon of manifest.icons) {
      expect(inBuild(icon.src), icon.src).toBe(true);
    }
  });
});

describe("the JavaScript", () => {
  it("is plain JavaScript, not TypeScript", () => {
    const script = page.querySelector('script[type="module"]')?.getAttribute("src") ?? "";
    expect(script).toMatch(/\.js$/);
  });

  it(`stays under ${JS_BUDGET_KB} KB`, async () => {
    const assets = await readdir(join(outDir, "assets"));
    let bytes = 0;
    for (const file of assets.filter((name) => name.endsWith(".js"))) {
      bytes += (await stat(join(outDir, "assets", file))).size;
    }
    expect(bytes).toBeGreaterThan(0);
    expect(bytes / 1024).toBeLessThan(JS_BUDGET_KB);
  });
});
