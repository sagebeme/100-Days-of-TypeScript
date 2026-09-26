# Changelog

## Unreleased

- Emoji and symbols between words no longer make double separators, or separators at the ends (#12, #24)
- `maxLength` never leaves a separator on the end (#19)
- ɔ, ɛ, ŋ, ɓ, ɗ, ƙ and ƴ (and their capitals) become o, e, ng, b, d, k and y instead of disappearing (#15)
- A clear `TypeError` when the text isn't a string (#23)
- Any `separator` works, including `"."` and `""` (#26)

## 2.3.1

- `maxLength` no longer cuts a word in half when there's a separator to cut at (#9)

## 2.3.0

- `transliterate` is exported on its own (#7)
- `&` becomes "and", `@` becomes "at" (#5)

## 2.2.0

- New option: `lowercase: false` keeps the capitals (#3)
