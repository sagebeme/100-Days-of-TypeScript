import { describe, it, expect } from "vitest";
import { allows, managerFor, packageProblems } from "./starter/packages.ts";

describe("allows: version ranges", () => {
  it("an exact version allows only itself", () => {
    expect(allows("1.2.3", "1.2.3")).toBe(true);
    expect(allows("1.2.3", "1.2.4")).toBe(false);
  });

  it("a caret allows newer minors and patches, but not a new major", () => {
    expect(allows("^5.0.2", "5.0.2")).toBe(true);
    expect(allows("^5.0.2", "5.9.0")).toBe(true);
    expect(allows("^5.0.2", "6.0.0")).toBe(false);
    expect(allows("^5.0.2", "5.0.1")).toBe(false);
  });

  it("a caret on a 0.x version is stricter: the minor stays the same", () => {
    expect(allows("^0.45.3", "0.45.9")).toBe(true);
    expect(allows("^0.45.3", "0.46.0")).toBe(false);
  });

  it("a tilde allows only newer patches", () => {
    expect(allows("~1.2.3", "1.2.9")).toBe(true);
    expect(allows("~1.2.3", "1.3.0")).toBe(false);
  });

  it("a star allows anything", () => {
    expect(allows("*", "99.0.0")).toBe(true);
  });

  it("refuses something that isn't a version", () => {
    expect(() => allows("^1.2", "1.2.0")).toThrow("Not a version");
  });
});

describe("packageProblems", () => {
  const good = {
    name: "my-app",
    private: true,
    engines: { node: ">=24" },
    scripts: { test: "vitest run" },
    dependencies: { zod: "^4.6.5" },
    devDependencies: { typescript: "^7.0.2", vitest: "^5.0.2" },
  };

  it("a tidy package.json has no problems", () => {
    expect(packageProblems(good)).toEqual([]);
  });

  it("lists every problem, in order", () => {
    expect(
      packageProblems({
        name: "my-app",
        dependencies: { vitest: "^5.0.2", "@types/node": "^24.0.0", zod: "^4.6.5" },
        devDependencies: { zod: "^4.6.5" },
      }),
    ).toEqual([
      'Add "private": true so the app can\'t be published to npm by accident.',
      'Add a "test" script, so "npm test" works.',
      'Add "engines": { "node": ">=24" } to say which Node version you need.',
      'Move "vitest" to devDependencies: it\'s only needed while developing.',
      'Move "@types/node" to devDependencies: it\'s only needed while developing.',
      '"zod" is in both dependencies and devDependencies. Keep one.',
    ]);
  });
});

describe("managerFor: lockfiles", () => {
  it("knows each manager by its lockfile", () => {
    expect(managerFor(["package.json", "package-lock.json"])).toBe("npm");
    expect(managerFor(["package.json", "pnpm-lock.yaml"])).toBe("pnpm");
    expect(managerFor(["yarn.lock", "README.md"])).toBe("yarn");
    expect(managerFor(["bun.lock"])).toBe("bun");
  });

  it("no lockfile means nobody has installed yet", () => {
    expect(managerFor(["package.json"])).toBeUndefined();
  });

  it("two lockfiles is a mistake, and it says which", () => {
    expect(() => managerFor(["package-lock.json", "pnpm-lock.yaml"])).toThrow(
      "Found lockfiles for npm and pnpm. Pick one package manager and delete the other lockfile.",
    );
  });
});
