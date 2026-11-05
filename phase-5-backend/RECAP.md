# Phase 5 Recap: Backend with Node

Days 55–66. You switched sides and built the server: from a bare `node:http` server to a deployed event ticketing API with a database, accounts, roles, M-Pesa payments and check-in at the gate.

## What this phase taught

Servers and routing, middleware, REST CRUD, validation and error responses, SQL with SQLite and Drizzle, relations and transactions, passwords and sessions, roles, integration tests, security, and running an API in production.

## Key ideas

1. **A server is one function from request to response.** Routing, status codes and headers are things you decide on purpose (Day 55).
2. **Middleware is an onion.** Code before `await next()` runs on the way in, code after it on the way out, and typed context makes `c.get("requestId")` a `string` (Day 56).
3. **Validate every input with shared schemas.** Body, query and params all go through Zod, and bad input gets the right status (`400`, `415`, `422`) with Problem Details a form can show per field (Day 58).
4. **The database keeps the rules too.** `UNIQUE`, `CHECK`, `REFERENCES`, composite keys and `ON DELETE CASCADE` stop bad data even when the code slips. Migrations record how the shape changed (Days 59 and 60).
5. **Transactions for anything that must happen together.** Counting seats and creating the order happen in one transaction, and check-in is one `UPDATE … WHERE checked_in_at IS NULL`, so two gates can't let one ticket in twice (Days 60 and 66).
6. **Never store a password.** Store a slow, salted hash (`scrypt`), compare with `timingSafeEqual`, and know `401` (who are you?) from `403` (you can't do this) (Day 61).
7. **One policy for permissions.** Routes ask `can(actor, action)`; they never check roles themselves (Day 62).
8. **Security is specific.** Parameters, never string-built SQL; escape once, when text goes into HTML; secrets out of logs and errors; rate limits per account and per address; allow-lists against mass assignment (Day 64).
9. **Production is its own job.** Config checked at start-up, logs with secrets redacted, health and readiness checks, and a graceful shutdown that finishes requests in flight (Day 65).

## Self-test

1. `PATCH /vendors/7` with `{ "naem": "Mama Oliech" }`. What should happen, and which Zod methods make it happen?
2. Why does a slow password hash help, when it makes every login slower?
3. Why do integration tests use a fresh `:memory:` database for every test and talk only HTTP?
4. A search does `` `... LIKE '%${q}%'` ``. What's wrong, and where do the `%` signs go instead?
5. Why must readiness say "not ready" as soon as shutdown starts?

<details><summary>Answers</summary>

1. A `422`: `.partial().strict()` rejects the unknown key instead of ignoring it, and `.refine()` insists on at least one field.
2. Nobody notices a fraction of a second on one login, but an attacker trying billions of guesses against a stolen database is slowed down by the same amount each time.
3. Tests can run in any order without affecting each other, and they keep working when the code inside changes, because they only use what a real client would.
4. It's injectable: the user's text becomes part of the SQL. Bind it as a parameter, with the wildcards inside the value: `"%" + q + "%"`.
5. So the load balancer stops sending new requests to a server that's on its way out, while it finishes the ones it has.

</details>

## Build it without steps

**A matatu SACCO booking API.** Routes have trips; each trip has a vehicle with 14 seats. Riders sign up, book a named seat on a trip and cancel up to an hour before it leaves; the SACCO's staff add trips and see each trip's passenger list. Use Hono, Zod and SQLite with migrations. Two riders must never get the same seat, even when they book at the same moment. Write integration tests for every rule, including the race, and add a health check and graceful shutdown.

No steps and no starter. Design the tables first, then write a failing test for each rule.
