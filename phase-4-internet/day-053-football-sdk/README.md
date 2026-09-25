# Day 53: Publish a Typed Football Data SDK — Packaging

Watch the video: *(not recorded yet)*

## The brief

Every app you build that shows football data repeats the same code: the base URL, the key header, checking the response, turning error bodies into errors. Today you package that once, as an **SDK**: a small library anyone can install with `npm install` and use in three lines, with full types in their editor.

```ts
import { createLigiClient, LigiError } from "@your-name/ligi";

const ligi = createLigiClient({ apiKey: process.env.LIGI_API_KEY! });
const table = await ligi.standings("kpl");
console.log(table.table[0].team.name); // your editor knows every field
```

```
$ node phase-4-internet/day-053-football-sdk/starter/try-it.ts
 #  Team                P   W   D   L   GD  Pts  Form
 1  Gor Mahia            6   5   1   0  +10   16  WWDWW
 2  Tusker               6   4   1   1   +5   13  WLWWD
...
LigiError 404 not_found: No team called simba
```

"Ligi" is a made-up API with made-up numbers, served locally by `fake-ligi-api.ts`. The skills work for any API.

## What you'll use

- **SDK design**: one `createLigiClient(options)`, methods named after what people want (`standings`, `team`, `fixtures`), and one error class with the details people branch on (`status`, `code`, `retryAfterSeconds`)
- **A public API surface**: `index.ts` exports only what users may rely on. Everything else can change without breaking anyone
- **Types from schemas** (Day 44), so the types in the package are exactly what the runtime checks guarantee
- **Building a package**: `tsc` emits `.js` for Node and `.d.ts` for editors. `rewriteRelativeImportExtensions` turns your `./client.ts` imports into `./client.js` in the output
- **`package.json` for publishing**: `exports` (with `types` first), `files` (so only `dist/` and the README ship, never your tests or secrets), `prepublishOnly` (so you can't publish stale code), and a real dependency on `zod`
- **`npm pack --dry-run`**: see exactly what would be published, without publishing anything

## Steps

1. Read `starter/index.ts` (the front door) and `starter/schemas.ts` (the shapes, from Day 44's lessons).
2. `starter/client.ts`: finish `LigiError`, then write `createLigiClient`. The TODO lists every rule.
3. `starter/package.json` is missing everything a published package needs. Add:
   - a `description`, `"license": "MIT"`
   - `"exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" } }` and `"types": "./dist/index.d.ts"`
   - `"files": ["dist", "README.md"]`
   - `"prepublishOnly": "npm run build"` in `scripts`
4. Try it against the fake API:

   ```bash
   node phase-4-internet/day-053-football-sdk/starter/fake-ligi-api.ts
   node phase-4-internet/day-053-football-sdk/starter/try-it.ts
   ```

5. Build it and see what would be published:

   ```bash
   cd phase-4-internet/day-053-football-sdk/starter
   npm run build
   npm pack --dry-run
   ```

   Open `dist/index.d.ts`: that's what your users' editors read.
6. Run the tests. They build the package, pack it, and install it in a pretend project to check its types work for a stranger:

   ```bash
   npm test -- day-053
   ```

## Publishing for real (optional)

Change `@your-name` to your npm username, then `npm login`, and `npm publish --access public` from the `starter/` folder. After that, every change needs a new `version` (following semver: `0.1.1` for a fix, `0.2.0` for a new feature, `1.0.0` when you promise not to break things). Published versions can't be changed, only deprecated, so dry-run first, every time.

## When you're stuck

- **`Cannot find module './client.ts'` when running the built code** — `rewriteRelativeImportExtensions` is missing from `tsconfig.build.json`, so the output still imports `.ts` files.
- **Users get `any` for everything** — `types` must come *first* inside `exports["."]`, and must point at a `.d.ts` that exists.
- **`npm pack` lists your tests, `.env` or the fake server** — the `files` field is missing or wrong. Only what it lists (plus `package.json`) ships.
- **`instanceof LigiError` is false** — set `this.name`, and throw `new LigiError(...)`, not a plain `Error`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
