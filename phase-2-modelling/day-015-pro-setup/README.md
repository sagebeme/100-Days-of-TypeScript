# Day 15: Pro Setup — Know Your Machinery

Watch the video: *(not recorded yet)*

## The brief

Phase 2 is about describing your data precisely with types, and that only works if you understand what's checking those types. For 14 days you've run `npm test` and `npm run typecheck` without opening the config files behind them. Today you read them, change them, and see what breaks.

Then you write one small function that only makes sense with `strict` mode on: finding the first number above a threshold, when there might not be one.

In Part 2 you get to know `package.json` and its counterparts (version ranges, lockfiles, `node_modules`, and the package managers that read them) by writing code that checks them.

```
firstAbove([3, 8, 12], 5)                →  8
firstAbove([1, 2], 5)                    →  undefined
firstAboveOrDefault([1, 2], 5, 99)       →  99
firstAboveOrDefault([0, 5], -1, 99)      →  0     (0 is a real answer, not "missing")
```

## What you'll use

- `tsconfig.json`, the compiler's rulebook for this repo
- `package.json`, which lists the tools and the commands (`npm test`, `npm run typecheck`)
- `vitest.config.ts`, which tells the test runner which files are tests
- `number | undefined`: a return type that says "you might get nothing back"
- Version ranges (`^`, `~`), lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`) and `node_modules`

## Tour: what each file does

| File | What it does |
| --- | --- |
| `package.json` | Lists your dev tools (TypeScript, Vitest) and the `scripts` you run. `"type": "module"` makes every `.ts` file use `import`/`export`. |
| `tsconfig.json` | Configures `tsc`. It only **checks** your code (`noEmit`); Node runs the `.ts` files itself. |
| `vitest.config.ts` | Says test files match `phase-*/**/*.test.ts`. |
| `phase-*/day-*/*.test.ts` | The tests. They import from `./starter/`, so they test *your* code. |

The most important line in `tsconfig.json` is `"strict": true`. It switches on a family of checks, including the one that makes `undefined` a real, separate type instead of something that silently sneaks into every variable.


## Part 2: `package.json` and its counterparts

Every JavaScript and TypeScript project you'll ever open starts with the same few files. Knowing what each one is for saves hours of confusion.

### `package.json`: what the project needs

Open the one at the root of this repo. The parts that matter most:

| Field | What it means |
| --- | --- |
| `name`, `version` | The project's name and version. They matter when you publish a package (Day 53). |
| `private: true` | "Never publish this to npm." Apps should have it, so a typo can't publish your code to the world. |
| `type: "module"` | Use `import`/`export` everywhere. |
| `engines` | Which Node versions it works on. This repo says `"node": ">=24"`. |
| `scripts` | Named commands. `npm test` runs `scripts.test`; `npm run typecheck` runs `scripts.typecheck`. |
| `dependencies` | Packages the program needs **when it runs**: `react`, `zod`, `hono`. |
| `devDependencies` | Packages only needed **while you build and test**: `typescript`, `vitest`, `@types/...`. A server that runs your app doesn't need them. |

### Version ranges: `^` and `~`

A dependency is written with a **range**, not one exact version. Versions follow **semver**, `MAJOR.MINOR.PATCH`: a new major can break your code, a new minor adds features, and a new patch fixes bugs.

| Range | Allows | Read it as |
| --- | --- | --- |
| `"5.0.2"` | only 5.0.2 | exactly this one |
| `"^5.0.2"` | 5.0.2 up to, but not including, 6.0.0 | "compatible with 5.0.2", the default `npm install` writes |
| `"^0.45.3"` | 0.45.3 up to 0.46.0 | before 1.0, every minor can break things, so `^` is stricter |
| `"~1.2.3"` | 1.2.3 up to 1.3.0 | "patches only" |
| `"*"` | anything | almost never what you want |

### The lockfile: exactly what was installed

A range like `^5.0.2` could mean 5.0.2 today and 5.9.0 next month. The **lockfile** records the *exact* version of every package, including the packages your packages depend on, so every computer installs exactly the same thing.

- **Commit it.** It's how your teammates, and your CI, get the same versions you tested with.
- **Commit exactly one.** Each package manager writes its own: npm → `package-lock.json`, pnpm → `pnpm-lock.yaml`, yarn → `yarn.lock`, bun → `bun.lock`. Two lockfiles in one project will disagree sooner or later. This repo uses npm, so its `.gitignore` keeps a stray `pnpm-lock.yaml` out.
- **Don't edit it by hand.** Change `package.json` (or run `npm install some-package`), and let the tool rewrite the lockfile.

### `node_modules`: the downloaded packages

`npm install` reads `package.json` and the lockfile, then downloads everything into `node_modules`. It's often hundreds of megabytes, and it can always be rebuilt, so:

- **Never commit it.** It's the first line of this repo's `.gitignore`.
- **Delete it and reinstall whenever things get strange.** Nothing in it is yours.
- **Reinstall after moving to another operating system.** Some packages download a different native binary for Windows, macOS and Linux, so a `node_modules` made on Windows won't run your tests on Linux. That really happened to this repo.

### npm, pnpm, yarn, bun

They all read the same `package.json` and fill `node_modules`. They differ in speed, in how they lay out `node_modules` (pnpm keeps one shared copy of each package on your disk and links to it), and in their lockfile. Pick one per project, the one its lockfile belongs to, and use it consistently:

| Task | npm | pnpm | yarn (version 2 and later) |
| --- | --- | --- | --- |
| Install everything | `npm install` | `pnpm install` | `yarn` |
| Install exactly the lockfile (CI) | `npm ci` | `pnpm install --frozen-lockfile` | `yarn install --immutable` |
| Add a dependency | `npm install zod` | `pnpm add zod` | `yarn add zod` |
| Add a dev dependency | `npm install -D vitest` | `pnpm add -D vitest` | `yarn add -D vitest` |
| Run a script | `npm run typecheck` | `pnpm typecheck` | `yarn typecheck` |
| Run a tool without installing it | `npx prettier --version` | `pnpm dlx prettier --version` | `yarn dlx prettier --version` |
| See what's out of date | `npm outdated` | `pnpm outdated` | `yarn upgrade-interactive` |
| Check for known security problems | `npm audit` | `pnpm audit` | `yarn npm audit` |

`npm install` may update the lockfile to match `package.json`. `npm ci` never does: it deletes `node_modules` and installs exactly what the lockfile says, or fails if the two disagree. That's why CI uses it (look at `.github/workflows/ci.yml`).

## Steps

1. Read `tsconfig.json` and `package.json` at the root of the repo. For each setting in `compilerOptions`, guess what it does, then look it up. You don't need to memorise them, just know they exist.
2. Open `starter/pro-setup.ts`. Write `firstAbove(numbers, threshold)`: return the first number greater than `threshold`, or `undefined` if there isn't one. `numbers.find(...)` does most of the work.
3. Write `firstAboveOrDefault(numbers, threshold, fallback)`: call `firstAbove` and return its result, or `fallback` if it was `undefined`. Compare against `undefined` explicitly. The last example above is the reason: `0` is a real answer, and a shortcut like `found || fallback` would wrongly replace it.
4. Run the tests:

   ```bash
   npm test -- day-015
   ```

5. **Experiment.** Open `tsconfig.json`, change `"strict": true` to `"strict": false`, and run `npm run typecheck`. Then re-break your own function on purpose: make `firstAboveOrDefault` return `firstAbove(...)` directly and see what the compiler says with `strict` on versus off. Put `"strict": true` back when you're done.

6. **Part 2.** Open `starter/packages.ts` and write the three functions:
   - `allows(range, version)`: does a range like `^5.0.2` allow `5.9.0`? Follow the table above, including the stricter rule for `0.x` versions.
   - `packageProblems(pkg)`: list what's wrong with an app's `package.json`, in this order: missing `"private": true`; no `test` script; no `engines.node`; then, for each dependency, a dev tool (`typescript`, `vitest`, `vite`, `eslint`, `prettier`, `tsx` or anything starting `@types/`) in `dependencies`, and a package listed in both `dependencies` and `devDependencies`. The test file has the exact messages.
   - `managerFor(files)`: from the files in a folder, which package manager does the project use? No lockfile gives `undefined`; two lockfiles is an error that names both.
7. Run the tests again: `npm test -- day-015` runs both test files.
8. **Explore your own machine:**

   ```bash
   npm ls vitest          # which version is installed, and what pulled it in
   npm outdated           # newer versions your ranges do or don't allow
   npm view zod versions  # every version of a package that exists
   ```

   Then pick a dependency in `package.json`, read its range, and use your `allows` function, or `npm outdated`, to work out whether `npm install` would upgrade it.

## When you're stuck

- **`npm run typecheck` says "Type 'number | undefined' is not assignable to type 'number'"** — that's `strict` protecting you. You returned something that might be `undefined` from a function that promised a `number`. Check for `undefined` first.
- **Your test for `[0, 5]` fails** — you probably used `||` or an `if (!found)` check. `0` is falsy in JavaScript. Use `found === undefined`.
- **After the experiment, errors won't go away** — make sure `"strict"` is back to `true` and saved.
- **`^0.45.3` allows `0.46.0` in your code** — before version 1.0.0, `^` keeps the *minor* fixed too. Check the major first.
- **The messages in `packageProblems` don't match** — copy them from `packages.test.ts`. The order matters as well.
- **`npm ci` fails with "lock file out of sync"** — someone changed `package.json` without updating the lockfile. Run `npm install` once, then commit both files together.
- **Still stuck?** Read `solution/pro-setup.ts` or `solution/packages.ts`, then close it and write your own from memory.
