import { describe, it, expect } from "vitest";
import { build } from "vite";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Runs the same production build as `npx vite build`, into a throwaway folder.
describe("the production build", () => {
  it("turns index.html and your TypeScript into plain JavaScript", async () => {
    const outDir = await mkdtemp(join(tmpdir(), "timer-build-"));
    try {
      await build({
        root: join(import.meta.dirname, "starter"),
        logLevel: "silent",
        build: { outDir, emptyOutDir: true },
      });

      const assets = await readdir(join(outDir, "assets"));
      const scripts = assets.filter((file) => file.endsWith(".js"));
      expect(scripts).toHaveLength(1);
      expect(assets.some((file) => file.endsWith(".css"))).toBe(true);

      const page = await readFile(join(outDir, "index.html"), "utf8");
      expect(page).not.toContain("main.ts");
      expect(page).toContain(scripts[0]);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  }, 30_000);
});
