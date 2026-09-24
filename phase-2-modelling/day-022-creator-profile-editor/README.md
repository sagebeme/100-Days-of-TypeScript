# Day 22: Creator Profile Editor — Partial, Pick and Omit

Watch the video: *(not recorded yet)*

## The brief

A creator app has profiles. The person who owns a profile can change their handle, display name and bio, but not their follower count, id or join date. Anyone else looking at the profile sees a public version without the internal fields. You could write three separate types by hand, but then every time `CreatorProfile` changes you'd update three places. Instead you **derive** the other types from the one you have.

```
updateProfile(profile, { bio: "Beats and bugs." })   →  a NEW profile with the new bio
updateProfile(profile, { followers: 999 })           →  compile error (and ignored at runtime)
toPublicProfile(profile)                             →  the profile without id and createdAt
```

## What you'll use

| Utility type | What it does | Example |
| --- | --- | --- |
| `Pick<T, "a" \| "b">` | keep only these keys | `Pick<CreatorProfile, "bio">` |
| `Omit<T, "a" \| "b">` | drop these keys | `Omit<CreatorProfile, "id">` |
| `Partial<T>` | make every key optional | `Partial<Pick<...>>` means "any of these, or none" |

You can combine them: `Partial<Pick<CreatorProfile, "handle" | "displayName" | "bio">>` reads as "some of the editable fields".

Also: object spread (`{ ...profile }`) to copy without mutating, and why **types don't exist at runtime**: TypeScript stops you writing `followers: 999` in your own code, but data that arrives from a form or a JSON body has no such protection, so your function still has to ignore it.

## Steps

1. Open `starter/profile.ts`. `CreatorProfile` is written. `ProfileUpdate` and `PublicProfile` are placeholders that you replace.
2. Define `ProfileUpdate` as `Partial<Pick<CreatorProfile, "handle" | "displayName" | "bio">>`.
3. Define `PublicProfile` as `CreatorProfile` without `id` and `createdAt`, using `Omit`.
4. Write `updateProfile(profile, update)`: return a **new** profile with the update applied. Only copy the three editable fields, and skip any that are `undefined` (an `undefined` bio shouldn't erase the old one). Never modify the `profile` you were given.
5. Write `toPublicProfile(profile)`: return the profile without `id` and `createdAt`. Destructuring with a rest element does it: `const { id, createdAt, ...rest } = profile;`.
6. Run the type checker as well as the tests. The test file contains `// @ts-expect-error` lines that only become valid once your types are right, so `npm run typecheck` is part of finishing today:

   ```bash
   npm test -- day-022
   npm run typecheck
   ```

## When you're stuck

- **`npm run typecheck` says "Unused '@ts-expect-error' directive"** — the test expected the compiler to reject something, and your type let it through. `ProfileUpdate` is probably still the placeholder, or `PublicProfile` still includes `id`.
- **`followers` still changes** — you spread the whole `update` into the result. Copy the three editable fields one by one instead, so unexpected keys from runtime data are ignored.
- **Old bio got wiped by `{ bio: undefined }`** — check each field for `!== undefined` before copying it.
- **`Omit` vs `Pick`?** `Pick` lists what you want to keep; `Omit` lists what you want to drop. Use whichever list is shorter.
- **Still stuck?** Read `solution/profile.ts`, then close it and write your own from memory.
