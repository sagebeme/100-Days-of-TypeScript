# Find words and join them, instead of deleting symbols after the fact

## What was wrong

`slugify` turned whitespace into separators first, then deleted every character that wasn't a letter, a digit, `-` or `_`. Anything that sat between two spaces (an emoji, `—`, `|`) was deleted *after* its spaces had already become separators, leaving two separators side by side, or one at the start or end. That one cause explains three reports: double dashes (#12, #24) and the trailing dash after `maxLength` (#19). The same deletion step removed any separator that wasn't `-` or `_`, so `separator: "."` produced `jionijazznight` (#26).

## The fix

Split the transliterated text into runs of letters and digits, and join them with the separator. Separators can no longer double up, sit on the ends, or be deleted, whatever the separator is. `maxLength` now takes as many whole words as fit, and hard-cuts only a single word that's longer than the limit, as before.

Also:

- The letters from #15 (ɔ ɛ ŋ ɓ ɗ ƙ ƴ and their capitals) are added to `LETTERS`. They have no Unicode decomposition, so they were being dropped.
- A non-string `text` now throws `TypeError: slugify expects a string, but got undefined` instead of failing inside `transliterate` (#23).

## Compatibility

Every existing test passes unchanged, and titles without the problems above give the same slugs as 2.3.1 with the default options. One edge did change, towards what the README has always described ("made only of letters, digits and the separator"): with a custom separator, a `-` or `_` inside a title now becomes that separator too. `"Hip-Hop Night"` with `separator: "_"` gives `hip_hop_night`, where it used to give `hip-hop_night`. No existing test covered it. I'm happy to split it out if you'd rather release it separately.

## Tests

A failing test for each issue first, in `test/slugify.test.ts` under "fixed in 2.3.2".

Fixes #12
Fixes #15
Fixes #19
Fixes #23
Fixes #24
Fixes #26
