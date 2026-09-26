# Day 98: Fix an Open-Source Issue

*A brief and a test suite. No walkthrough.*

## The brief

You'll use open-source code every day of your career. Today you give some back. The practice is on `slugo`, a small slug library that Tikiti's event URLs depend on. It has its own README, CONTRIBUTING guide, changelog, tests, and six open issues in `ISSUES.md`. Then you do it for real.

Most first contributions fail for reasons that have nothing to do with code: the fix changes what already worked, it patches the one example instead of the cause, it has no test, or nobody can tell what it closes. The tests today check for all of those.

## The job

1. **Read before you touch anything**: `slugo/README.md` (what slugo promises), `CONTRIBUTING.md` (how they want changes), then `ISSUES.md`.
2. **Triage.** Which issues are real bugs? Which report is a duplicate? Which isn't a bug at all? Several share one cause. Find it in `src/slugify.ts` before fixing anything.
3. **Reproduce** each bug as a failing test in `slugo/test/slugify.test.ts`, mentioning its issue number. Watch each one fail.
4. **Fix the cause.** One change to how `slugify` works fixes four reports. The fifth needs a few new letters in `transliterate.ts`, and the sixth a clear error.
5. **Don't change what works.** The library's existing tests must pass unchanged, and so must a list of real slugs made by 2.3.1: those are people's URLs.
6. **Changelog**: one line per fix under `## Unreleased`, ending with the issue number.
7. **`PULL_REQUEST.md`**: what was wrong, why, how you fixed it, anything that changed on purpose, and a `Fixes #N` line for each issue it closes. GitHub closes those issues when the PR is merged.
8. **`REPLIES.md`**: a kind reply to each issue that needs no code, under `## #N`. Point the duplicate at the original.

## Done when

```bash
npm test -- day-098
```

## Then do it for real

1. Find a project you actually use: a library from this course (Zod, Hono, Vitest, Drizzle, TanStack Query), or something smaller.
2. Look for issues labelled **good first issue** or **help wanted**. Pick a small one that has a way to reproduce it, and that nobody has claimed. Before you start, comment: "I'd like to work on this. Here's my plan: …".
3. Fork, clone, and get *their* tests passing before you change anything. Read their CONTRIBUTING file; it's different everywhere.
4. Then everything above: a failing test, the smallest fix for the cause, a changelog line if they keep one, and a clear PR.
5. Expect review comments. They're the point: answer each one, push fixes, and don't take it personally.

Documentation fixes count too. A confusing sentence in a README that you understood the hard way is a perfect first PR.

## Stretch

- `slugo` has no benchmark. Tomorrow is Day 99: would your fix make it slower? Measure it.
- Add a `locale` option: German `ä` → `ae`, Swedish `ä` → `a`. Write the proposal as an issue first. A new option is a design discussion, not just a PR.
