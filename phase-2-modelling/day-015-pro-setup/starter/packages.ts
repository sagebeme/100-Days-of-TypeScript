// Part 2 of Day 15: package.json and its counterparts, written as code you can test.

type Version = [major: number, minor: number, patch: number];

// Given: "1.2.3" → [1, 2, 3]. Throws for anything that isn't three whole numbers.
function parse(version: string): Version {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
    throw new Error(`Not a version: "${version}"`);
  }
  return [parts[0], parts[1], parts[2]];
}

/**
 * Does a dependency range in package.json allow this version?
 *   "1.2.3"   exactly 1.2.3
 *   "^1.2.3"  1.2.3 or newer, but still 1.x.x   (for 0.x versions: still 0.2.x)
 *   "~1.2.3"  1.2.3 or newer, but still 1.2.x
 *   "*"       anything
 */
export function allows(range: string, version: string): boolean {
  // TODO: handle "*", then "^", then "~", then an exact version. Use parse() on both sides.
  return false;
}

export type PackageJson = {
  name?: string;
  private?: boolean;
  type?: "module" | "commonjs";
  engines?: { node?: string };
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/** Common mistakes in an app's package.json, in the order the README lists them. */
export function packageProblems(pkg: PackageJson): string[] {
  const problems: string[] = [];
  // TODO: "private", then the "test" script, then engines.node, then each dependency
  //       (a dev tool in dependencies, or a package listed in both)
  return problems;
}

export type Manager = "npm" | "pnpm" | "yarn" | "bun";

export const LOCKFILES: Record<Manager, string> = {
  npm: "package-lock.json",
  pnpm: "pnpm-lock.yaml",
  yarn: "yarn.lock",
  bun: "bun.lock",
};

/** Which package manager a project uses, from the files in its folder. See the README for the rules. */
export function managerFor(files: string[]): Manager | undefined {
  // TODO
  return undefined;
}
