# 100 Days of TypeScript

One project a day, for 100 days. You start with a gamer tag generator in your terminal and finish with an AI agent plugged into an app you built yourself.

Every day ships with tests. You run `npm test` and the tests tell you when you got it right, instead of you comparing your code to someone else's solution.

No JavaScript needed first. Node 24 runs TypeScript files directly, so you write TypeScript from Day 1.

## What you need

| | |
|---|---|
| **Node.js** | 24 LTS or newer ([nodejs.org](https://nodejs.org)) |
| **An editor** | VS Code, or whatever you already use |
| **Git** | to clone this repo and save your work |
| **Time** | about an hour a day |

Check your Node version:

```bash
node --version
```

You want `v24` or higher. Older versions cannot run `.ts` files directly, and every day here depends on that.

## Getting started

```bash
git clone git@github.com:sagebeme/100-Days-of-TypeScript.git
cd 100-Days-of-TypeScript
npm install
```

Then start Day 1:

```bash
cd phase-1-terminal/day-001-gamer-tag
```

Read the `README.md` in that folder, write your code in `starter/`, and run the tests.

## How each day works

Every day is a folder that looks like this:

```
day-001-gamer-tag/
├── README.md            what to build, and the steps to get there
├── starter/             your code goes here
├── solution/            look after you've tried it
└── gamer-tag.test.ts    the tests that say when you're done
```

The routine:

1. **Watch the video** for that day, linked in the day's README.
2. **Read the brief.** It says what the finished project does.
3. **Write your code** in `starter/`.
4. **Run the tests** until they pass.
5. **Compare with `solution/`** once yours works. There's always another way to write it.

Run one day's tests:

```bash
npm test -- day-001
```

Run everything you've done so far:

```bash
npm test
```

### Browser days

From Day 30, projects run in the browser. Start a dev server for that day's `starter/` folder and open the address it prints (usually `http://localhost:5173`):

```bash
npm run dev -- phase-3-browser/day-030-split-the-bill/starter
```

The tests still run with `npm test`. They use a pretend browser, so you don't need one open.

## The course

100 days in 8 phases. Each phase ends with a bigger project that uses everything before it.

| Phase | Days | What you learn | Ends with |
|---|---|---|---|
| **1. Terminal foundations** | 1–14 | variables, types, conditionals, loops, functions, modules | a text adventure |
| **2. Modelling with types** | 15–28 | interfaces, classes, generics, unions, errors, testing | a CLI money tracker |
| **3. Browser and games** | 29–42 | the DOM, Vite, Canvas, game loops | two games you can share |
| **4. Talking to the internet** | 43–54 | APIs, Zod, secrets, SMS and M-Pesa, scraping | a daily bot |
| **5. Backend with Node** | 55–66 | servers, databases, auth, security, tests | a deployed ticketing API |
| **6. Full-stack React** | 67–74 | typed components, forms, data fetching, Next.js | a ticketing web app |
| **7. AI in TypeScript** | 75–80 | LLM calls, structured output, tools, retrieval, evals | a bilingual support agent |
| **8. Portfolio** | 81–100 | no walkthrough: a brief, tests, and you | 20 projects of your own |

From Phase 5 on, one app grows with you: an event ticketing platform. You build its API, put a web app on top, then hand it to an AI agent.

Days 81 to 100 have no build-along video. You get a short brief and a test suite, the way real work arrives.

## Why these projects

The projects come from things people actually care about: games, music, football, sneakers, street food, side hustles. Each one has a Nairobi flavour, from matatu routes to M-Pesa payments, so the code you write looks like the place you live in. You don't need to be Kenyan to follow any of it.

## About `enum`

Node runs TypeScript by removing the types and running what's left. It never rewrites your code. That means `enum`, which needs code generated at runtime, fails to run:

```
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript enum is not supported in strip-only mode
```

Use a plain object instead, which works everywhere and gives you the same safety:

```ts
const Fare = { Peak: 120, OffPeak: 80 } as const;
type Fare = typeof Fare[keyof typeof Fare];
```

Day 27 goes into this properly. Until then, just avoid `enum`.

## Progress

- [ ] Phase 1: Terminal foundations (Days 1–14)
- [ ] Phase 2: Modelling with types (Days 15–28)
- [ ] Phase 3: Browser and games (Days 29–42)
- [ ] Phase 4: Talking to the internet (Days 43–54)
- [ ] Phase 5: Backend with Node (Days 55–66)
- [ ] Phase 6: Full-stack React (Days 67–74)
- [ ] Phase 7: AI in TypeScript (Days 75–80)
- [ ] Phase 8: Portfolio (Days 81–100)

Tick a phase off when its tests pass. Commit your work daily: in three months you'll want to see how far you came.

## Getting unstuck

1. **Read the error.** TypeScript errors say which line and which type. That's usually the whole answer.
2. **Re-read the day's README.** The step you skipped is normally in there.
3. **Run the tests.** A failing test names what it expected and what it got.
4. **Open an issue** in this repo if something is wrong or unclear. That helps whoever comes next.

## Licence

MIT for the code. Course materials are for learning, personal or in a classroom.
