import { describe, it, expect, expectTypeOf } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FARE, fareFor, totalFare, isFareKind, type Fare, type FareKind } from "./starter/fares.ts";

describe("the fare table", () => {
  it("has the right fares, typed as exact literals (checked by npm run typecheck)", () => {
    expect(FARE).toEqual({ peak: 120, offPeak: 80, night: 150 });
    expect(fareFor("peak")).toBe(120);

    expectTypeOf(FARE.peak).toEqualTypeOf<120>();
    expectTypeOf<FareKind>().toEqualTypeOf<"peak" | "offPeak" | "night">();
    expectTypeOf<Fare>().toEqualTypeOf<120 | 80 | 150>();
  });
});

describe("fareFor", () => {
  it("looks up each fare", () => {
    expect(fareFor("peak")).toBe(120);
    expect(fareFor("offPeak")).toBe(80);
    expect(fareFor("night")).toBe(150);
  });
});

describe("totalFare", () => {
  it("adds up a day of rides", () => {
    expect(totalFare(["peak", "offPeak", "night"])).toBe(350);
    expect(totalFare(["offPeak", "offPeak"])).toBe(160);
  });

  it("is 0 for no rides", () => {
    expect(totalFare([])).toBe(0);
  });
});

describe("isFareKind", () => {
  it("accepts the real fare names", () => {
    expect(isFareKind("peak")).toBe(true);
    expect(isFareKind("night")).toBe(true);
  });

  it("rejects anything else, including names every object inherits", () => {
    expect(isFareKind("weekend")).toBe(false);
    expect(isFareKind("toString")).toBe(false);
    expect(isFareKind("")).toBe(false);
  });

  it("narrows a string to FareKind", () => {
    const input: string = "night";
    if (isFareKind(input)) {
      expect(fareFor(input)).toBe(150);
    } else {
      expect.unreachable("night is a fare kind");
    }
  });
});

describe("plain Node and enum", () => {
  it("rejects an enum, and runs your as-const module without any build step", async () => {
    const dir = await mkdtemp(join(tmpdir(), "fares-"));
    try {
      // Part 1: the lesson. Real Node refuses to run a file that contains an enum.
      const enumFile = join(dir, "enum-fare.ts");
      await writeFile(enumFile, "enum Fare { Peak = 120, OffPeak = 80 }\nconsole.log(Fare.Peak);\n");
      const withEnum = spawnSync(process.execPath, [enumFile], { encoding: "utf8" });
      expect(withEnum.status).not.toBe(0);
      expect(withEnum.stderr).toContain("ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX");

      // Part 2: your module has to run the same way, with nothing but Node.
      const moduleUrl = new URL("./starter/fares.ts", import.meta.url).href;
      const script = `import { fareFor, totalFare } from ${JSON.stringify(moduleUrl)};\nconsole.log(fareFor("peak"), totalFare(["night", "offPeak"]));\n`;
      const yours = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8" });
      expect(yours.stderr).not.toContain("ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX");
      expect(yours.status).toBe(0);
      expect(yours.stdout.trim()).toBe("120 230");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
