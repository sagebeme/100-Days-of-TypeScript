# Day 62: Organisers vs Fans — Roles and Protected Routes

Watch the video: *(not recorded yet)*

## The brief

Yesterday the API learned *who* you are. Today it learns *what you're allowed to do*. The ticketing platform has three kinds of account:

| Role | Can |
| --- | --- |
| **fan** | browse events, say they're going |
| **organiser** | everything a fan can, plus create events and manage **their own** |
| **admin** | everything, plus change anyone's role |

And a few rules that aren't about roles at all: a draft is invisible to everyone but its organiser; a published event can be cancelled but never deleted (people planned around it); nobody edits a cancelled event; and the platform must never be left without an admin.

## 401 or 403 (or 404)?

- **401 Unauthorized** means "I don't know who you are". Log in, and try again.
- **403 Forbidden** means "I know exactly who you are, and the answer is no". Logging in again won't change it.
- **404 Not Found**, on purpose: when someone who can't see a draft asks for it, saying 403 would confirm the draft exists. So they get the same 404 as for an event that really doesn't exist.

## What you'll use

- **Guard middleware**: `requireUser` (401) and `requireRole("organiser", "admin")` (401 or 403), added to the routes that need them
- **Typed guards**: after `requireUser`, `c.get("user")` is typed as a user, not `user | null`
- **A policy**: one function, `can(actor, action)`, holds every permission rule. Routes ask it; they never check roles themselves. Rules that depend on *which* event (ownership) can't be done by a role guard alone
- **Invariants**: "there's always at least one admin" is checked before the change, not discovered after

## Steps

1. Read `starter/migrations/0002_roles_and_events.sql`: a later migration that gives every existing user the `fan` role.
2. `starter/policy.ts`: `can`. The policy tests run without a database or a server, because it's a plain function.
3. `starter/guards.ts`: `requireUser` and `requireRole`. `currentUser` is Day 61's middleware.
4. `starter/app.ts`: the routes are written. Write `check`, which turns a "no" from the policy into the right status, and the last-admin rule.
5. Run the tests:

   ```bash
   npm test -- day-062
   ```

## Reference

Every method and status code, with when to use each: [HTTP: methods and status codes](../../reference/http.md).

## Check yourself

1. When does the API answer `401`, when `403`, and why does a fan asking for someone's *draft* get `404`?
2. Predict the output, for a published event with `organiserId: 2`: `can({ id: 3, role: "organiser" }, { do: "edit-event", event })` and `can({ id: 2, role: "organiser" }, { do: "delete-event", event })`
3. Why can't `requireRole("organiser")` on the route be the whole check for editing an event?
4. Why is "there's always at least one admin" checked *before* a role change rather than after?

<details><summary>Answers</summary>

1. `401`: I don't know who you are (not logged in). `403`: I know who you are, and you can't do this. A `403` on a draft would confirm it exists, so it gets the same `404` as an event that doesn't.
2. `false` and `false`. Organiser 3 doesn't own it. Organiser 2 does, but a published event can only be cancelled, never deleted: people may have planned around it.
3. A role guard only knows *what kind* of user you are. Editing depends on *which* event: an organiser may edit their own and not anyone else's. That's why the rule lives in `can`, which sees the event.
4. Once the last admin has demoted themselves, nobody is left who could put it right. An invariant is protected by refusing the change that would break it.

</details>

## When you're stuck

- **Organisers can edit each other's events** — a role guard says "organisers may edit events", not "this organiser may edit this event". Ownership needs the policy, with the event loaded.
- **A fan gets 401 creating an event** — they're logged in, so it's a 403. A 401 is only for "nobody's logged in".
- **Strangers get 403 for a draft** — use `hideAs404` for anything that could reveal a draft.
- **The last admin demotes themselves** — count the admins *before* the update, and refuse if it's one.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
