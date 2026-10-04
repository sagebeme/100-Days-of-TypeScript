// Part 2 of Day 15: package.json and its counterparts, written as code you can test.

// ---------------------------------------------------------------- version ranges

type Version = [major: number, minor: number, patch: number];

function parse(version: string): Version {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error(`Not a version: "${version}"`);
  }
  return [parts[0], parts[1], parts[2]];
}

// -1, 0 or 1, comparing major, then minor, then patch.
function compare(a: Version, b: Version): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Does a dependency range in package.json allow this version?
 *   "1.2.3"   exactly 1.2.3
 *   "^1.2.3"  1.2.3 or newer, but still 1.x.x   (for 0.x versions: still 0.2.x)
 *   "~1.2.3"  1.2.3 or newer, but still 1.2.x
 *   "*"       anything
 */
export function allows(range: string, version: string): boolean {
  if (range === "*") return true;
  const v = parse(version);
  if (range.startsWith("^")) {
    const base = parse(range.slice(1));
    const sameMajor = v[0] === base[0];
    const sameMinorWhenZero = base[0] !== 0 || v[1] === base[1];
    return compare(v, base) >= 0 && sameMajor && sameMinorWhenZero;
  }
  if (range.startsWith("~")) {
    const base = parse(range.slice(1));
    return compare(v, base) >= 0 && v[0] === base[0] && v[1] === base[1];
  }
  return compare(v, parse(range)) === 0;
}

// ---------------------------------------------------------------- package.json checks

export type PackageJson = {
  name?: string;
  private?: boolean;
  type?: "module" | "commonjs";
  engines?: { node?: string };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

// Tools you only need while building and testing, never when the app runs.
const DEV_TOOLS = ["typescript", "vitest", "vite", "eslint", "prettier", "tsx"];

function isDevTool(name: string): boolean {
  return DEV_TOOLS.includes(name) || name.startsWith("@types/");
}

/** Common mistakes in an app's package.json, in a fixed order. An empty list means it looks fine. */
export function packageProblems(pkg: PackageJson): string[] {
  const problems: string[] = [];
  if (pkg.private !== true) {
    problems.push('Add "private": true so the app can\'t be published to npm by accident.');
  }
  if (!pkg.scripts?.test) {
    problems.push('Add a "test" script, so "npm test" works.');
  }
  if (!pkg.engines?.node) {
    problems.push('Add "engines": { "node": ">=24" } to say which Node version you need.');
  }
  for (const name of Object.keys(pkg.dependencies ?? {})) {
    if (isDevTool(name)) {
      problems.push(`Move "${name}" to devDependencies: it's only needed while developing.`);
    }
    if (pkg.devDependencies && name in pkg.devDependencies) {
      problems.push(`"${name}" is in both dependencies and devDependencies. Keep one.`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------- lockfiles

export type Manager = "npm" | "pnpm" | "yarn" | "bun";

export const LOCKFILES: Record<Manager, string> = {
  npm: "package-lock.json",
  pnpm: "pnpm-lock.yaml",
  yarn: "yarn.lock",
  bun: "bun.lock",
};

/**
 * Which package manager a project uses, judged from the files in its folder.
 * No lockfile: undefined (nobody has installed yet). More than one: an error, because two
 * lockfiles disagree about exact versions and the project will behave differently per machine.
 */
export function managerFor(files: string[]): Manager | undefined {
  const found = (Object.keys(LOCKFILES) as Manager[]).filter((m) => files.includes(LOCKFILES[m]));
  if (found.length > 1) {
    throw new Error(`Found lockfiles for ${found.join(" and ")}. Pick one package manager and delete the other lockfile.`);
  }
  return found[0];
}
