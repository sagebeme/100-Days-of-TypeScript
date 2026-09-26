# slugo

Turn any title into a clean URL slug. Tiny, no dependencies.

```ts
import { slugify } from "slugo";

slugify("Jioni Jazz Night");           // "jioni-jazz-night"
slugify("Café Ngoma: Live!");          // "cafe-ngoma-live"
slugify("Rock & Roll @ Uhuru");        // "rock-and-roll-at-uhuru"
```

## API

### `slugify(text, options?)`

Returns a slug made only of the letters `a–z` (or `A–Z` with `lowercase: false`), the digits `0–9`, and the separator. Words are joined by **exactly one** separator, and a slug **never starts or ends** with one. Letters with accents lose them (`é` → `e`), and letters from other alphabets that have a usual Latin spelling get it (`ß` → `ss`, `ø` → `o`). Apostrophes are dropped rather than splitting a word: `"it's"` → `"its"`. Anything else that isn't a letter or digit separates words.

Throws a `TypeError` if `text` isn't a string.

| Option | Default | |
| --- | --- | --- |
| `separator` | `"-"` | Any string: `"_"`, `"."`, `""` |
| `lowercase` | `true` | `false` keeps the capitals |
| `maxLength` | none | The slug is at most this long. It's cut at a word boundary when there is one, and never ends in a separator |

### `transliterate(text)`

Just the letter conversion: `"Ærøskøbing"` → `"AEroskobing"`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
