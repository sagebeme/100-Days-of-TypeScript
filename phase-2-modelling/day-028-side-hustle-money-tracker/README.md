# Day 28: Side-Hustle Money Tracker — Phase 2 Capstone

Watch the video: *(not recorded yet)*

## The brief

You do logos on the side, or you resell sneakers, or you run a Saturday car wash. Money comes in and goes out and you can never remember the balance. Build a command-line tool that records it and saves everything to a JSON file, so it's still there tomorrow.

```
$ node phase-2-modelling/day-028-side-hustle-money-tracker/starter/cli.ts add income 5000 "Logo design"
Added income KES 5000: Logo design

$ node phase-2-modelling/day-028-side-hustle-money-tracker/starter/cli.ts add expense 300 "Data bundle"
Added expense KES 300: Data bundle

$ node phase-2-modelling/day-028-side-hustle-money-tracker/starter/cli.ts summary
Income: KES 5000
Expenses: KES 300
Balance: KES 4700
```

This day uses most of Phase 2 together: union types, code split across modules, pure functions, type guards for untrusted data, `async`/`await` with files, and errors thrown on purpose.

## What you'll use

- Two modules: `ledger.ts` (the data and saving) and `commands.ts` (turning typed-in commands into actions). `cli.ts` is a thin wrapper that is already written for you
- `Entry`, `Ledger` and `NewEntry` types, with `"income" | "expense"` as a literal union
- Type guards (`isEntry`, `isLedger`) to check a file you read from disk before you trust it
- `readFile` / `writeFile` from `node:fs/promises`, and handling the one error you *expect* (file doesn't exist yet) while letting others through
- `process.argv`: the words typed after `node file.ts` (`cli.ts` handles this)

## Steps

Work in this order. Each layer is testable before the next one exists.

1. **The pure core** in `starter/ledger.ts`:
   - `isEntry(value)` and `isLedger(value)`: type guards. An entry has a whole-number `id`, a `kind` that is `"income"` or `"expense"`, a positive finite `amount`, a `label` string, and a `date` string. A ledger is `{ entries }` where every item is an entry.
   - `addEntry(ledger, input)`: returns a **new** ledger with the entry added and given `id` equal to the old entry count plus one. Throw `"Amount must be a positive number"` for an amount that isn't positive (this also catches `NaN`).
   - `summarize(ledger)`: returns `{ income, expenses, balance }`.
2. **Saving and loading**, still in `ledger.ts`:
   - `saveLedger(path, ledger)`: write the ledger as pretty JSON (`JSON.stringify(ledger, null, 2)`).
   - `loadLedger(path)`: if the file doesn't exist yet, return an empty ledger `{ entries: [] }`. If the file is not valid JSON, let the `SyntaxError` through. If it parses but isn't a valid ledger, throw `"Ledger file is corrupted"`. To spot a missing file: `error instanceof Error && "code" in error && error.code === "ENOENT"`. Re-throw anything else.
3. **The commands** in `starter/commands.ts`: `runCommand(args, filePath, today)` returns the text to print:
   - `add <income|expense> <amount> <label...>`: load, add, save, and return `Added <kind> KES <amount>: <label>`. The label is everything after the amount joined with spaces. Wrong or missing arguments throw `"Usage: add <income|expense> <amount> <label>"`.
   - `summary`: return three lines: `Income: KES 5000`, `Expenses: KES 300`, `Balance: KES 4700`.
   - `list`: one line per entry, `#1 2026-09-24 income  KES 5000 Logo design` (the kind is padded to 7 characters). With no entries, return `No entries yet`.
   - No command at all throws `"Usage: add | list | summary"`. An unknown command throws `"Unknown command: <name>"`.
4. Run the tests. Some of them run your real CLI as a separate process, the way a user would:

   ```bash
   npm test -- day-028
   ```

5. **Use it for real.** From the root of the repo, run the commands in the brief above. Your data lands in `money.json` in the folder you ran them from (it's ignored by git, so it won't get committed).

## When you're stuck

- **`loadLedger` crashes on the first run** — there's no file yet. A missing file is normal, so return an empty ledger instead of throwing.
- **The type guard says a valid ledger is corrupted** — log what you're checking. A common slip is testing `Number.isInteger(id)` on the wrong field, or forgetting that `entries` must be an array.
- **CLI tests fail but the function tests pass** — run the CLI yourself from the repo root and read the error it prints. `cli.ts` catches errors from `runCommand` and prints the message.
- **`Cannot find module`** — imports between your own files need the `.ts` extension, like `./ledger.ts`.
- **Still stuck?** Read the solution files, then close them and write your own from memory.
