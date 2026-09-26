# slugo: open issues

Six open issues, copied from the tracker. Some are bugs. Some aren't.

---

## #12 Emoji make double dashes

**opened by kamau-dev** · label: bug

We generate event URLs from titles, and one of our organisers put an emoji in hers:

```js
slugify("Jazz 🎷 Night") // "jazz--night"
```

Expected `jazz-night`. slugo 2.3.1, Node 24.

> **comment from ochieng-codes:** Same with an em dash: `slugify("Jioni — Live")` gives `jioni--live`. And `slugify("— Jazz —")` gives `-jazz-` with dashes on the ends.

---

## #15 Letters from West African names disappear

**opened by adwoa-builds** · label: bug

```js
slugify("Ɔsɛe Festival")     // "se-festival"
slugify("Ŋutifafa Ɓaki")     // "utifafa-aki"
```

Ɔ, ɛ, Ŋ, ɔ and Ɓ are just removed. These are ordinary letters in Akan, Ewe, Hausa and others, and our ticketing site sells events in Accra and Kano. Expected something like `osee-festival` and `ngutifafa-baki`.

> **comment from maintainer (slugo-bot):** Thanks. PRs welcome. The usual Latin spellings: ɔ → o, ɛ → e, ŋ → ng, ɓ → b, ɗ → d, ƙ → k, ƴ → y (and the capitals).

---

## #19 maxLength sometimes leaves a trailing dash

**opened by wairimu-k** · label: bug

The README says the slug "never ends in a separator", but:

```js
slugify("Jioni — Jazz Night", { maxLength: 6 }) // "jioni-"
```

---

## #21 lowercase: false should still lowercase accented letters??

**opened by random-user-8812** · label: question

```js
slugify("Ünïcödé Party", { lowercase: false }) // "Unicode-Party"
```

Why are there capitals in my slug? Slugs should always be lower case. This is a bug.

---

## #23 Crash with undefined

**opened by njeri-m** · label: bug

Our form sends `undefined` when the title is empty:

```
TypeError: Cannot read properties of undefined (reading 'normalize')
    at transliterate (slugo/src/transliterate.ts:23:6)
```

The README says it throws a `TypeError` if the text isn't a string, which it technically does, but this message makes it look like slugo is broken. Could it say what's wrong?

---

## #24 double dashes in URLs with emojis

**opened by brian-otieno** · label: none

`slugify("Party 🎉🎉 Time")` → `party--time`. Please fix, it's making our URLs ugly.

---

## #26 separator: "." does nothing

**opened by fatuma-dev** · label: bug

```js
slugify("Jioni Jazz Night", { separator: "." }) // "jionijazznight"
```

Expected `jioni.jazz.night`. The README says the separator can be "any string".
