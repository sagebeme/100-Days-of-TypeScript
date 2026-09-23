# Day 1: Gamer Tag Generator

Watch the video: *(not recorded yet)*

## The brief

Every serious gamer has a tag. Write a function that turns a real name and a lucky number into one, wrapped in the classic `xX_..._Xx` bracket.

```
buildGamerTag("Amina", 7)  →  "xX_Amina7_Xx"
buildGamerTag("Kip", 10)   →  "xX_Kip10_Xx"
```

## What you'll use

- `const` for a value that never changes once you set it
- `let` for a value you build up in more than one step
- Template strings (`` `${...}` ``) to combine text and variables, instead of gluing pieces together with `+`

## Steps

1. Open `starter/gamer-tag.ts`.
2. Declare two `const`s: `prefix` holding `"xX_"`, and `suffix` holding `"_Xx"`.
3. Declare a `let` called `tag`, starting as `` `${name}${favoriteNumber}` `` — the name and number stuck together.
4. Reassign `tag` to wrap the current value of `tag` in `prefix` and `suffix`.
5. Return `tag`.
6. Run the tests.

```bash
npm test -- day-001
```

## When you're stuck

- **"Cannot find name 'name'" or similar** — check the function's parameter list in `starter/gamer-tag.ts`. Don't rename the parameters; the tests call the function by its exact name and expect exactly two arguments in that order.
- **Output is in the wrong order, or missing a piece** — you should reassign `tag` exactly once, and that reassignment should use `tag`'s *own current value* inside the new template string (`` `${prefix}${tag}${suffix}` ``). `let` reassignment replaces the whole value; it doesn't append unless you explicitly include the old value in the new one.
- **Still stuck?** Open `solution/gamer-tag.ts`, read it once, close it, then write your own version from memory. Copying it in doesn't teach you anything the test couldn't already tell you.
