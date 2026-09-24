# Day 25: Sheng Dictionary — Test-Driven Development

Watch the video: *(not recorded yet)*

## The brief

Build a tiny dictionary for Sheng, the Nairobi street slang that mixes Swahili, English and whatever the mtaa invented last month. The dictionary can look up a word, add a word, search by word or meaning, and pick a "word of the day".

```
lookup(entries, "  POA ")          →  { word: "poa", meaning: "cool, fine, all good" }
search(entries, "money")           →  [ the "ganji" entry ]
wordOfTheDay(entries, 7)           →  a different word on different days
```

The code is small. The point of today is **how** you write it.

## What you'll use

Test-driven development (TDD) is a loop of three moves:

1. **Red**: write a test for something that doesn't work yet. Run it. Watch it fail, for the right reason.
2. **Green**: write the smallest code that makes it pass. Not the best code, the smallest.
3. **Refactor**: with the test green, tidy up. The tests tell you straight away if you broke something.

Why bother? A test you've never seen fail might not be testing anything. Seeing red first proves the test can catch a mistake.

## Steps

The tests in `sheng-dictionary.test.ts` are already written and grouped into four steps. Work through them **one step at a time** using the `-t` filter, which runs only tests whose names contain the text:

```bash
npm test -- day-025 -t "step 1"
```

For each step:

1. **Run it and read the failure.** Read the message. What does the test expect, and what did it get?
2. **Write the smallest code that fixes it** in `starter/sheng-dictionary.ts`, run again, and get to green.
3. **Refactor** if something is clumsy, and run again to confirm it's still green.
4. Move on to the next step.

The four steps:

1. **`lookup`** — find an entry by word, ignoring case and stray spaces around it. Return `undefined` if there isn't one.
2. **`addEntry`** — return a **new** array with the entry added. Throw `"<word>" is already in the dictionary` if the word is already there (ignoring case).
3. **`search`** — entries whose word **or** meaning contains the query (ignoring case), sorted by word A to Z. An empty or blank query returns `[]`.
4. **`wordOfTheDay`** — sort the entries by word, then pick the one at `dayOfYear % entries.length`. Throw `"Dictionary is empty"` if there are none.

Finish with everything at once:

```bash
npm test -- day-025
```

### Your turn: write the test first

Add one more behaviour of your own, the TDD way. For example: `lookup` should also find a word when the dictionary entry has capital letters (`"Poa"`), or `search` should match part of a word. Write a new `it(...)` at the bottom of `sheng-dictionary.test.ts` **first**, run it and watch it fail, and only then change the code to make it pass.

## When you're stuck

- **A test passes before you've written any code** — check that you're running the right day, and read what the test really asserts. A test that can't fail isn't helping you.
- **`lookup("POA")` returns `undefined`** — compare both sides lowercased and trimmed, not just one.
- **`addEntry` changed the original array** — `push` mutates. Return `[...entries, entry]`.
- **`search` results are in the wrong order** — sort a copy with `localeCompare` on `word`.
- **Still stuck?** Read `solution/sheng-dictionary.ts`, then close it and write your own from memory.
