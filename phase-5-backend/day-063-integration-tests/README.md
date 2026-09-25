# Day 63: Integration Tests for Your API — Test Kits and Mutation Testing

Watch the video: *(not recorded yet)*

## The brief

For 62 days, the tests were written for you. Today **you write them**, for yesterday's roles-and-events API (copied into `starter/`, unchanged except that parts of it can be swapped for experiments).

Two things make API tests pleasant or painful, and you build both:

1. **A test kit.** A good kit turns a 20-line test into 5: a fresh database per test, a user of any role logged in with one line, an HTTP client that already speaks JSON, and a clock you control.
2. **Scenarios.** Each is one story about the API, told through HTTP the way a real client uses it: "an organiser can't edit another organiser's event".

Then comes the part that makes today different: **how do you know your tests are any good?** A test that passes against working code proves little. What matters is whether it would *fail* against broken code. So the official tests take four copies of the app, each with one realistic bug put in on purpose (**mutants**), and run your scenarios against every one. You pass when every mutant is caught by at least one of your scenarios. That's **mutation testing**, and it's how teams check the quality of their tests.

```
✓ your scenarios pass against the real app: an organiser can't edit another organiser's published event
✓ the mutants are caught: organisers can edit ANY event, not just their own
✗ the mutants are caught: drafts are visible to everyone
    No working scenario noticed this bug: "drafts are visible to everyone". Write one that would.
```

## What you'll use

- **Test isolation**: every test gets its own `:memory:` database, so tests can run in any order and never affect each other
- **Factories**: `addUser("Ada", "admin")` puts a user straight into the database and makes a session, skipping the sign-up form (which has its own tests on Day 61)
- **A thin HTTP client** over `app.request()`: no server, no ports, and a response is just `{ status, body }`
- **A controllable clock**, so "30 days later" takes no time at all
- **Black-box testing**: scenarios only use HTTP, never the database directly, so they keep working when the code inside changes
- **Mutation testing**: good tests fail when the code is wrong

## Steps

1. `starter/testkit.ts`: `createKit`. Every TODO is one small helper.
2. `starter/scenarios.ts`: two examples are written. Add at least six more (the TODO lists good candidates). Each should set up only what it needs, do one thing, and check the result.
3. Run the tests:

   ```bash
   npm test -- day-063
   ```

   First, make the test-kit checks pass. Then add scenarios until every mutant is caught.
4. Only once they're all caught, open `starter/mutants.ts` and read what the bugs were. Did your scenarios catch them for the reason you expected?

## When you're stuck

- **Tests pass alone but fail together** — something is shared between them. Every kit needs its own database, clock and cookies.
- **Every request comes back 401** — the `Cookie` header must be exactly `session=<token>`, and the session must be created at the kit's clock time, not the real one.
- **A mutant isn't caught** — think about what the bug would change that a user could *see* through the API, then write the scenario that looks for exactly that.
- **`JSON.parse` fails on a 204** — a 204 has an empty body. Return `null` for an empty response.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
