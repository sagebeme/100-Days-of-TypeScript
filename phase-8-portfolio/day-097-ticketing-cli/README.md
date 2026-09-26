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
