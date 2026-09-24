import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadPlays, buildWrapped, createWrapped, type Play } from "./starter/wrapped.ts";

const plays: Play[] = [
  { track: "Melanin", artist: "Sauti Sol", msPlayed: 180_000 },
  { track: "Suzanna", artist: "Sauti Sol", msPlayed: 240_000 },
  { track: "Nyar Kanyada", artist: "Nyashinski", msPlayed: 300_000 },
  { track: "Kwaheri", artist: "Khaligraph Jones", msPlayed: 300_000 },
  { track: "Last Last", artist: "Burna Boy", msPlayed: 60_000 },
];

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "wrapped-"));
  await writeFile(join(dir, "plays.json"), JSON.stringify(plays));
  await writeFile(join(dir, "broken.json"), "{ this is not json");
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("loadPlays", () => {
  it("reads and parses a JSON file", async () => {
    await expect(loadPlays(join(dir, "plays.json"))).resolves.toEqual(plays);
  });

  it("rejects when the file does not exist", async () => {
    await expect(loadPlays(join(dir, "missing.json"))).rejects.toThrow(/ENOENT/);
  });

  it("rejects with a SyntaxError when the file is not valid JSON", async () => {
    await expect(loadPlays(join(dir, "broken.json"))).rejects.toThrow(SyntaxError);
  });
});

describe("buildWrapped", () => {
  it("adds up the total minutes", () => {
    expect(buildWrapped(plays).totalMinutes).toBe(18);
  });

  it("ranks artists by time, breaking ties by name", () => {
    expect(buildWrapped(plays).topArtists).toEqual([
      { artist: "Sauti Sol", minutes: 7 },
      { artist: "Khaligraph Jones", minutes: 5 },
      { artist: "Nyashinski", minutes: 5 },
    ]);
  });

  it("respects topCount", () => {
    expect(buildWrapped(plays, 1).topArtists).toEqual([{ artist: "Sauti Sol", minutes: 7 }]);
  });

  it("copes with no plays at all", () => {
    expect(buildWrapped([])).toEqual({ totalMinutes: 0, topArtists: [] });
  });
});

describe("createWrapped", () => {
  it("reads the plays, writes the summary file, and returns the summary", async () => {
    const outputPath = join(dir, "wrapped.json");
    const summary = await createWrapped(join(dir, "plays.json"), outputPath, 2);

    expect(summary.topArtists).toHaveLength(2);
    const onDisk = JSON.parse(await readFile(outputPath, "utf8"));
    expect(onDisk).toEqual(summary);
    expect(onDisk.totalMinutes).toBe(18);
  });

  it("rejects when the input file is missing, without writing an output file", async () => {
    const outputPath = join(dir, "never-written.json");
    await expect(createWrapped(join(dir, "missing.json"), outputPath)).rejects.toThrow(/ENOENT/);
    await expect(readFile(outputPath, "utf8")).rejects.toThrow(/ENOENT/);
  });
});
