import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync, mkdirSync, cpSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { createLigiClient, LigiError, DEFAULT_BASE_URL, type Fetcher } from "./starter/index.ts";
import { server, API_KEY } from "./starter/fake-ligi-api.ts";

const starter = join(import.meta.dirname, "starter");
const repoRoot = join(import.meta.dirname, "..", "..");
const tsc = join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "tsc.cmd" : "tsc");
const run = (command: string, args: string[], cwd: string) =>
  execFileSync(command, args, { cwd, encoding: "utf8", shell: process.platform === "win32" });

const standingsBody = {
  league: "kpl",
  season: "2026/27",
  updated: "2026-10-05T18:00:00Z",
  table: [
    { position: 1, team: { id: "gor", name: "Gor Mahia", short: "GOR" }, played: 6, won: 5, drawn: 1, lost: 0, goalsFor: 13, goalsAgainst: 3, points: 16, form: "WWDWW" },
  ],
};

function reply(body: unknown, status = 200, headers: Record<string, string> = {}): Fetcher & ReturnType<typeof vi.fn> {
  return vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers }));
}

describe("createLigiClient", () => {
  it("needs a key", () => {
    expect(() => createLigiClient({ apiKey: "" })).toThrow("createLigiClient needs an apiKey");
  });

  it("gets the standings with the key in a header", async () => {
    const fetchFn = reply(standingsBody);
    const standings = await createLigiClient({ apiKey: "k-123", fetch: fetchFn }).standings();
    expect(standings.table[0].team.name).toBe("Gor Mahia");
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${DEFAULT_BASE_URL}/leagues/kpl/standings`);
    const headers = new Headers(init.headers);
    expect(headers.get("X-Api-Key")).toBe("k-123");
    expect(headers.get("Accept")).toBe("application/json");
  });

  it("builds clean URLs", async () => {
    const fetchFn = reply({ fixtures: [] });
    const ligi = createLigiClient({ apiKey: "k", baseUrl: "http://localhost:5353/v1///", fetch: fetchFn });
    await ligi.fixtures("gor", { from: "2026-10-01" });
    await ligi.fixtures("a/b");
    expect(fetchFn.mock.calls[0][0]).toBe("http://localhost:5353/v1/teams/gor/fixtures?from=2026-10-01");
    expect(fetchFn.mock.calls[1][0]).toBe("http://localhost:5353/v1/teams/a%2Fb/fixtures");
  });

  it("gives fixtures a real Date for kickoff", async () => {
    const fetchFn = reply({
      fixtures: [
        {
          id: "f1",
          kickoff: "2026-10-04T12:00:00Z",
          home: { id: "gor", name: "Gor Mahia", short: "GOR" },
          away: { id: "afc", name: "AFC Leopards", short: "AFC" },
          venue: "Nyayo",
          status: "finished",
          score: { home: 2, away: 1 },
        },
      ],
    });
    const [fixture] = await createLigiClient({ apiKey: "k", fetch: fetchFn }).fixtures("gor");
    expect(fixture.kickoff).toBeInstanceOf(Date);
    expect(fixture.kickoff.toISOString()).toBe("2026-10-04T12:00:00.000Z");
  });

  it("turns API errors into LigiErrors", async () => {
    const ligi = createLigiClient({ apiKey: "k", fetch: reply({ error: { code: "not_found", message: "No team called simba" } }, 404) });
    const error = await ligi.team("simba").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LigiError);
    expect(error).toMatchObject({ name: "LigiError", status: 404, code: "not_found", message: "No team called simba" });
  });

  it("keeps Retry-After on a 429", async () => {
    const ligi = createLigiClient({
      apiKey: "k",
      fetch: reply({ error: { code: "rate_limited", message: "Slow down" } }, 429, { "Retry-After": "30" }),
    });
    await expect(ligi.standings()).rejects.toMatchObject({ status: 429, code: "rate_limited", retryAfterSeconds: 30 });
  });

  it("copes with an error that isn't JSON", async () => {
    const ligi = createLigiClient({ apiKey: "k", fetch: reply("<h1>Bad gateway</h1>", 502) });
    await expect(ligi.standings()).rejects.toMatchObject({
      status: 502,
      code: "http_error",
      message: "Ligi API request failed with status 502",
    });
  });

  it("refuses data it doesn't understand", async () => {
    const ligi = createLigiClient({ apiKey: "k", fetch: reply({ table: "soon" }) });
    await expect(ligi.standings()).rejects.toMatchObject({ code: "bad_response" });
  });
});

describe("against the fake API over HTTP", () => {
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("reads the table, a team and filtered fixtures", async () => {
    const ligi = createLigiClient({ apiKey: API_KEY, baseUrl });
    expect((await ligi.standings()).table.map((r) => r.team.short)).toEqual(["GOR", "TUS", "AFC", "HMB"]);
    expect((await ligi.team("tus")).stadium).toBe("Ruaraka Grounds");
    expect((await ligi.fixtures("gor", { from: "2026-10-10", to: "2026-10-12" })).map((f) => f.id)).toEqual(["f2"]);
  });

  it("gets a 401 with a wrong key", async () => {
    await expect(createLigiClient({ apiKey: "wrong", baseUrl }).standings()).rejects.toMatchObject({ status: 401, code: "unauthorized" });
  });
});

describe("package.json", () => {
  const pkg = () => JSON.parse(readFileSync(join(starter, "package.json"), "utf8"));

  it("has a scoped name, a version and a licence", () => {
    expect(pkg().name).toMatch(/^@[\w-]+\/[\w-]+$/);
    expect(pkg().version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(pkg().license).toBe("MIT");
    expect(pkg().description?.length).toBeGreaterThan(10);
  });

  it("points at the built files, with types first", () => {
    const entry = pkg().exports["."];
    expect(Object.keys(entry)[0]).toBe("types");
    expect(entry).toEqual({ types: "./dist/index.d.ts", import: "./dist/index.js" });
    expect(pkg().types).toBe("./dist/index.d.ts");
  });

  it("publishes only dist and the README", () => {
    expect(pkg().files).toEqual(["dist", "README.md"]);
  });

  it("builds before publishing, and lists zod as a real dependency", () => {
    expect(pkg().scripts.prepublishOnly).toBe("npm run build");
    expect(pkg().dependencies.zod).toBeDefined();
  });
});

describe("building and packing", { timeout: 120_000 }, () => {
  it("builds JavaScript and type declarations that work", async () => {
    const out = join(import.meta.dirname, `.build-${process.pid}`);
    try {
      run(tsc, ["-p", join(starter, "tsconfig.build.json"), "--outDir", out], starter);
      for (const file of ["index.js", "index.d.ts", "client.js", "client.d.ts", "schemas.js", "schemas.d.ts"]) {
        expect(existsSync(join(out, file)), file).toBe(true);
      }
      expect(readFileSync(join(out, "index.js"), "utf8")).toContain('from "./client.js"');
      const built = await import(join(out, "index.js"));
      expect(typeof built.createLigiClient).toBe("function");
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  });

  it("packs exactly the files a user needs", () => {
    const dist = join(starter, "dist");
    try {
      run(tsc, ["-p", join(starter, "tsconfig.build.json")], starter);
      const [packed] = JSON.parse(run("npm", ["pack", "--dry-run", "--json"], starter));
      const files: string[] = packed.files.map((f: { path: string }) => f.path).sort();
      expect(files).toEqual([
        "README.md",
        "dist/client.d.ts",
        "dist/client.js",
        "dist/index.d.ts",
        "dist/index.js",
        "dist/schemas.d.ts",
        "dist/schemas.js",
        "package.json",
      ]);
    } finally {
      rmSync(dist, { recursive: true, force: true });
    }
  });

  it("gives someone who installs it working types", () => {
    const home = mkdtempSync(join(tmpdir(), "ligi-consumer-"));
    const installed = join(home, "node_modules", "@your-name", "ligi");
    try {
      mkdirSync(installed, { recursive: true });
      run(tsc, ["-p", join(starter, "tsconfig.build.json"), "--outDir", join(installed, "dist")], starter);
      cpSync(join(starter, "package.json"), join(installed, "package.json"));
      symlinkSync(join(repoRoot, "node_modules", "zod"), join(home, "node_modules", "zod"), "junction");
      writeFileSync(join(home, "package.json"), '{ "type": "module" }');
      writeFileSync(
        join(home, "tsconfig.json"),
        JSON.stringify({ compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext", strict: true, noEmit: true, types: [] }, files: ["app.ts"] }),
      );
      writeFileSync(
        join(home, "app.ts"),
        'import { createLigiClient, type Standings } from "@your-name/ligi";\n' +
          'const table: Standings = await createLigiClient({ apiKey: "k" }).standings();\n' +
          "const points: number = table.table[0].points;\nexport { points };\n",
      );
      expect(() => run(tsc, ["-p", "tsconfig.json"], home)).not.toThrow();
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  });
});
