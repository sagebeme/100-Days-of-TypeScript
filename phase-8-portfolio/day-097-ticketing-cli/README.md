# Day 97: A CLI for the Ticketing API

*A brief and a test suite. No walkthrough.*

## The brief

`tikiti`: buy tickets from the terminal, against the Day 66 API.

```
$ tikiti events
ID  EVENT             WHEN                    VENUE              PRICE     SEATS
 1  Jioni Jazz Night  Sat 12 Dec 2026, 18:00  Uhuru Gardens  KES 1,000  412 left

$ tikiti login amina@example.com
Password:
✔ Logged in as Amina (amina@example.com).

$ tikiti buy 1 -q 2 --phone "0712 345 678"
Order 12: 2 seats held, KES 2,000.
Check your phone and enter your M-Pesa PIN (0712345678).
✔ Order 12 is paid: 2 tickets, KES 2,000. M-Pesa receipt QKX12ABC34.

Your tickets
  T1-3419C1CF5A2891AA
  T2-055C33999142F9B6
```

A good CLI is polite to two audiences. **People** get clear words, colour, a live "Waiting for M-Pesa… 12s", and tables that fit their terminal. **Scripts** get clean stdout, `--json`, and exit codes they can trust. Most of today is making both true at once.

## What's already written

- `api.ts`: a client for the Day 66 API. It throws `ApiError` (the API said no) or `Unreachable` (it didn't answer).
- `io.ts`: everything from the outside world, passed in: argv, env, stdout and stderr, the clock, the prompt. That's how the tests run the whole CLI without a terminal, a network or your real home folder.
- `cli.ts`: plugs in the real ones.

## The rules (tested)

- **`args.ts`**
  - Parse with `node:util`'s `parseArgs`: options in any order, `-q 3` or `--quantity=3`.
  - Phone numbers written any way Kenyans write them become `07…`.
  - Every mistake is a `UsageError` that says how to fix it. A typo gets a suggestion: `Did you mean "events"?`, but only within two edits.
- **`format.ts`**
  - Colour only for a person at a terminal, following [`NO_COLOR`](https://no-color.org), `FORCE_COLOR` and `TERM=dumb`.
  - Width is measured as it looks: colour codes take no room.
  - Tables right-align numbers, never end a line in spaces, and shrink the right columns with "…" to fit.
- **`session.ts`**
  - Keep the session cookie in `$XDG_CONFIG_HOME/tikiti` or `~/.config/tikiti`, with mode `600`: it's as good as your password.
  - Never send one server's cookie to another.
  - A mangled file just means "logged out".
- **`poll.ts`**
  - Ask about the order until M-Pesa has answered, or two minutes are up.
  - Ride out two network blips; three in a row is an outage.
  - An error from the API stops at once.
- **`run.ts`**
  - Exit `0` when it worked, `1` when it didn't, `2` when the command itself was wrong.
  - Results go to stdout; problems (`✘ …`) and the "Waiting…" line go to stderr, so `tikiti order 12 --json | jq` always works.
  - An expired session is forgotten, and the person is told to log in again.
  - The API's own reasons ("Sold out") are passed on word for word.

## Steps

1. Read the tests, then `api.ts` and `io.ts` (both already written). Everything from the outside world reaches your code through `Io`.
2. `args.ts`: `normalisePhone`, `closest`, then `parseCommand` with `parseArgs`. `npm test -- day-097 -t "reading the command line"`.
3. `format.ts`: `shouldColor`, `visibleWidth`, `table`, `kes` and `when`. `npm test -- day-097 -t "output for people"`.
4. `session.ts`, then `poll.ts`. `npm test -- day-097 -t "staying logged in"` and `-t "waiting for M-Pesa"`.
5. `run.ts`: one command at a time (`help`, `events`, `login`, `buy`, `order`, `logout`), with the exit codes. `npm test -- day-097 -t "the whole CLI"`.
6. Run the tests, then try it against the Day 66 API (see "Try it for real").

## Done when

```bash
npm test -- day-097
```

## Try it for real

Start the Day 66 API and create an event (its README shows how), then:

```bash
alias tikiti="node $PWD/phase-8-portfolio/day-097-ticketing-cli/starter/cli.ts"
tikiti events
tikiti login amina@example.com
tikiti buy 1 --phone 0712345678
# in another terminal, be Safaricom:
node phase-5-backend/day-066-event-ticketing-api/starter/simulate-callback.ts ws_CO_DEMO_1 1000 paid
```

## Stretch

- `tikiti tickets`: every ticket you have, across orders (the Day 66 stretch route).
- Print each ticket's QR code in the terminal with block characters (`▀▄█`).
- Publish it: a `bin` entry in a `package.json`, so `npm install -g` gives people a real `tikiti` command.

## Check yourself

1. Predict the output: `closest("evnets", COMMAND_NAMES)`, `closest("BUY", COMMAND_NAMES)` and `closest("purchase", COMMAND_NAMES)`
2. Predict the output: `visibleWidth("\x1b[1mJioni 🎷\x1b[0m")`, and `"Jioni 🎷".length`.
3. Predict `shouldColor` for `{ NO_COLOR: "" }` at a terminal, `{ NO_COLOR: "1" }` at a terminal, and `{ FORCE_COLOR: "1" }` piped to a file.
4. Why does the "Waiting for M-Pesa… 12s" line go to stderr and not stdout?

<details><summary>Answers</summary>

1. `"events"` (two edits away), `"buy"` (lowercased first) and `null`: nothing is within two edits, so no suggestion is better than a wrong one.
2. `7` and `8`. Colour codes take no room, and the emoji is two UTF-16 units but one character on screen.
3. `true` (the rule is "set and not empty"), `false` and `true`.
4. Stdout is for the result, so `tikiti order 12 --json | jq` gets clean JSON. Progress and problems are for the person watching, and stderr still reaches their screen.

</details>

## When you're stuck

- **`--jsn` is accepted, or a stray word is ignored** — call `parseArgs` with `strict: true` and `allowPositionals: true`, catch its error and rethrow it as a `UsageError` starting with `tikiti <command>:`. Then check how many positionals the command takes.
- **`BUY` gets no suggestion** — lowercase the word before measuring the edit distance, and only suggest when it's 2 or less.
- **`Jioni 🎷` measures 8** — `"🎷".length` is 2 (two UTF-16 units). Strip the colour codes (`/\x1b\[[0-9;]*m/g`), then count `[...text].length`.
- **Lines end in spaces** — pad every column but the last, or `trimEnd()` each line when you're done.
- **The session file isn't mode 600** — `writeFile`'s `mode` only applies when it creates the file. Call `chmod(file, 0o600)` afterwards too.
- **`NO_COLOR=""` turns colour off** — the rule is "set and not empty". Check `NO_COLOR` first, then `FORCE_COLOR`, then `TERM=dumb`, then whether it's a terminal.
- **Polling gives up after one blip** — count `Unreachable` errors in a row and reset the count on a good answer; throw on the third. Rethrow an `ApiError` straight away.
- **`--json | jq` breaks** — anything that isn't the result (`✘ …`, "Waiting…") goes to `io.err`, never `io.out`.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
