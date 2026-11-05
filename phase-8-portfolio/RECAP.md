# Phase 8 Recap: Portfolio

Days 81–100. No walkthroughs: twenty briefs with test suites, the way real work arrives. A blog generator, games, a PWA, a link shortener, real-time chat, a kanban board, a route finder, a Discord bot, a CLI, a fix to someone else's library, a 10x speed-up, and your own portfolio site.

## What this phase taught

How to work from a brief and a test suite alone: reading tests as the specification, choosing your own structure, and finishing things people can use. Along the way, a lot of the craft that separates working code from good code.

## Key ideas

1. **Rules in pure, tested modules; the page draws them.** The race, the board, the game engine, the streak rules and the focus rules have no DOM, clock or network in them, so every rule can be tested (Days 82, 83, 85, 89, 93 and 95).
2. **Money in whole units, adding up exactly.** Shillings or cents as integers, rounded once per line, with leftovers handed out so the parts always equal the total (Days 86 and 90).
3. **Time is where bugs hide.** A day is the calendar day where the person is, dates are read at noon UTC, and puzzles and schedules use Nairobi time whatever the computer says (Days 81, 85, 92 and 95).
4. **Make randomness repeatable.** A seed in the world, or a fixed shuffle, means the same game for the same keys and the same word for everyone today (Days 92 and 93).
5. **Anything typed by a stranger is escaped and checked.** HTML-escape every piece of text, allow only safe link schemes, verify signatures, and give a wrong key the same `404` as a missing link (Days 81, 87, 94 and 96).
6. **Pick the right algorithm, then measure.** A heap for Dijkstra, alpha-beta for minimax, and a profiler before any optimisation: the slow part is rarely where you'd guess (Days 83, 91 and 99).
7. **Don't break what people rely on.** Old saved boards are upgraded, not thrown away; existing slugs stay the same, because they're people's URLs (Days 89 and 98).
8. **Be polite to people and to scripts.** Clear words and colour for a person; clean stdout, `--json` and honest exit codes for a script (Day 97).

## Self-test

1. Why does the link shortener answer `302` and not `301`?
2. Why does a Discord bot read the request body as text before parsing it?
3. A report gets four times slower when the orders double. What do you look for?
4. Why return a list of every content problem instead of throwing at the first one?
5. Why does a portfolio project page tell the problem before listing the tools?

<details><summary>Answers</summary>

1. Browsers cache a `301` forever, so clicks would stop being counted and the link could never change.
2. The signature covers the exact bytes Discord sent. Parsing and re-stringifying can change them.
3. Something n²: a `find`, `filter` or `includes` inside a loop over another list. Build a `Map` or `Set` once.
4. Someone fixing their content can fix everything in one go, instead of one build per mistake.
5. The person reading remembers the problem you solved and how it went, not the list of tools.

</details>

## Build it without steps

**Your own project.** Pick something you or someone you know would actually use: a tool for your chama, your church choir's rota, your cousin's salon bookings, your five-a-side league. Write the brief yourself in a README (who it's for, what it must do, what it won't do), then the tests, then the code. Ship it, give it a page on your portfolio, and send the link to the person it's for.

There's no starter and no solution. That's the point: this is what the next hundred days look like.
