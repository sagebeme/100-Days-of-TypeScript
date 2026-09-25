# Day 46: Match-Day Reminders — Scheduled Email

Watch the video: *(not recorded yet)*

## The brief

You've missed the first half of a big game because you forgot it was on. Never again. Build a program that follows your team and emails you twice per match: the evening before (18:00, Nairobi time) and two hours before kick-off.

```
$ node phase-4-internet/day-046-match-day-reminders/starter/cli.ts "Gor Mahia" --once
Following Gor Mahia: 1 upcoming match(es).
To: you@example.com
Subject: Kick-off in 2 hours: Gor Mahia vs AFC Leopards

Two hours to kick-off. Get the snacks in.

Gor Mahia vs AFC Leopards
FKF Premier League
Sun 4 Oct, 15:00 Nairobi time
```

It has to be dependable: it can't send the same reminder twice, it can't send one after kick-off, and it has to survive being restarted. The fixtures in `fixtures.json` are made up for practice.

## What you'll use

- **Time zones**: fixtures are stored in UTC (the `Z` in `16:30:00Z`), and "the evening before" means Nairobi's evening. Kenya is always UTC+3 with no summer time, so a fixed offset works; `Intl.DateTimeFormat` with `timeZone: "Africa/Nairobi"` does the formatting
- **Scheduling**: work out *when* the next thing should happen, then sleep until then with `setTimeout`, instead of checking every minute
- **Idempotency**: each reminder has an id (`fixture:eve`), and ids that have gone out are saved to `sent.json`, so a crash or restart never sends a duplicate
- **An `EmailSender` interface** with two implementations: a real email API and the console. The rest of the app doesn't know which one it's using
- **HTML email**: email apps ignore most CSS, so the design uses simple inline styles, and a plain-text version goes along with it

## Steps

1. `starter/schedule.ts`:
   - `eveOf(kickoff)`: 18:00 Nairobi time, the day before kickoff *in Nairobi*. A 01:30 kick-off on the 5th in Nairobi is 22:30 on the 4th in UTC; its eve is the 4th.
   - `remindersFor(fixture)`, `followed(fixtures, team)`.
   - `dueReminders(fixtures, sent, now)`: due, not sent, and kick-off still in the future. Earliest first.
   - `nextReminderAt(fixtures, sent, now)`.
2. `starter/email.ts`: `reminderEmail` is written for you (read how it escapes team names). Write `resendSender`, which sends through [Resend](https://resend.com)'s API with your key in the `Authorization` header.
3. `starter/runner.ts`: `loadSent` / `saveSent`, `sendDue`, and `runForever`. A timer can't wait more than about 24.8 days (`MAX_WAIT_MS`), so a longer wait is cut to that and the next tick simply works out the rest.
4. Run the tests. The runner tests pass in their own clock and timers, so a two-day wait takes a millisecond:

   ```bash
   npm test -- day-046
   ```

5. Try it without an email account. Reminders print to the terminal instead:

   ```bash
   node phase-4-internet/day-046-match-day-reminders/starter/cli.ts Arsenal --once
   ```

   The sample fixtures are in October 2026, so if that's in the past for you, edit the dates in `fixtures.json`.

## Sending real email

1. Make a free account at resend.com and create an API key.
2. In `starter/`, make a `.env` file:

   ```
   RESEND_API_KEY=re_your_key
   EMAIL_FROM=onboarding@resend.dev
   EMAIL_TO=the-address-you-signed-up-with@example.com
   ```

   While you're testing, Resend's shared `onboarding@resend.dev` sender can only deliver to your own sign-up address. To send to anyone else, verify a domain you own in Resend's dashboard.
3. Run it without `--once` and leave it running. It prints when the next reminder is due, and sleeps until then.

## When you're stuck

- **Every reminder is three hours out** — you mixed local time and UTC. Do the maths in UTC, and only use Nairobi time to find "the day before" and to format.
- **Restarting sends everything again** — you save `sent.json` once at the end. Save after *each* email, so a crash halfway doesn't forget what already went out.
- **One failed email stops the rest** — catch the error for that one reminder, log it, and keep going. Don't mark it as sent, so it's tried again.
- **`TimeoutOverflowWarning`** — you asked `setTimeout` for more than `MAX_WAIT_MS`. Cap the wait.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
