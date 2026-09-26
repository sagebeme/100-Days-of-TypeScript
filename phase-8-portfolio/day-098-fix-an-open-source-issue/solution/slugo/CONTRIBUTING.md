# Contributing to slugo

Thanks for helping. slugo is used by a lot of sites, so every slug it makes is somebody's URL. A change that alters the slug for a title that used to work breaks links. Please:

1. **Reproduce it first.** Add a test to `test/slugify.test.ts` that fails because of the bug, and check it fails before you change any code.
2. **Fix the cause, not the one example.** If an emoji makes a double dash, so does `—` or `|`.
3. **Don't change what already works.** Every existing test must pass unchanged. If you think an existing test is wrong, open an issue to discuss it first.
4. **No new dependencies.**
5. **Add a line to `CHANGELOG.md`** under `## Unreleased`, ending with the issue number: `- Emoji no longer make double separators (#12)`.
6. **In the pull request**, say what was wrong, why, and how you fixed it, with `Fixes #12` for each issue it closes, so GitHub closes them when it's merged.

Not every issue needs a code change. If something works as documented, say so kindly, point to the docs, and suggest what they can do instead.
