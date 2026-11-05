# Day 48: A Client That Survives Bad Wi-Fi — Retries, Timeouts and Backoff

Watch the video: *(not recorded yet)*

## The brief

On the matatu, at the stage, in a basement: the connection comes and goes. A request fails, and the app shows an error, when trying once more a second later would have worked. Or worse, it spins forever, waiting for an answer that's never coming.

Build `fetchWithRetry`, a drop-in replacement for `fetch` that:

- **gives up on a request that takes too long** (a timeout),
- **tries again** when the problem is probably temporary (a dropped connection, a busy server),
- **waits a bit longer each time**, with some randomness (backoff with jitter),
- **does what the server says** when it replies "slow down, try in 3 seconds" (`Retry-After`),
- and **never repeats something that could charge someone twice**.

```
$ node phase-4-internet/day-048-survive-bad-wifi/starter/cli.ts
1. 200 {"match":"Gor Mahia 2 - 1 AFC Leopards","minute":78} after 80 ms
   retry 1 in 437 ms (status 503)
2. 200 {"match":"Gor Mahia 2 - 1 AFC Leopards","minute":78} after 447 ms
   retry 1 in 1000 ms (status 429)
3. 200 {"match":"Gor Mahia 2 - 1 AFC Leopards","minute":78} after 1008 ms
```

## What you'll use

- **`AbortSignal.timeout(ms)`**: a signal that cancels a `fetch` when time runs out, and **`AbortSignal.any([...])`** to combine it with a caller's own cancel button
- **Which failures to retry**: a dropped connection, a timeout, and statuses `408 429 500 502 503 504` are temporary. A `400` or `404` means *you* asked for something wrong, and asking again won't change the answer
- **Exponential backoff**: wait roughly 0.5 s, then 1 s, 2 s, 4 s. Give the network time to come back
- **Jitter**: a random wait below that ceiling. Without it, a thousand phones that lost signal at the same moment all retry at the same moment too, and knock the server over again
- **Idempotency**: a `GET` can be sent twice safely. A `POST` that pays for tickets can't, unless it carries an `Idempotency-Key` header that lets the server recognise a repeat
- **Error `cause`**: the final `NetworkError` keeps the last real error inside it, for debugging

## Steps

1. `starter/resilient.ts`:
   - `isRepeatable(init)`: safe methods, or anything with an `Idempotency-Key`.
   - `parseRetryAfter(header, now)`: seconds, or an HTTP date.
   - `backoffDelay(attempt, options)`: full jitter.
   - `fetchWithRetry(url, init, fetch, options)`: the loop. The TODO lists every rule.
2. Run the tests. Most use a fake `fetch` and a fake `sleep`, so a minute of backoff takes no time. Two talk to a real server that hangs and drops connections on purpose:

   ```bash
   npm test -- day-048
   ```

3. See it for real. Start the flaky server, then run the client in a second terminal and watch the retries:

   ```bash
   node phase-4-internet/day-048-survive-bad-wifi/starter/flaky-server.ts
   node phase-4-internet/day-048-survive-bad-wifi/starter/cli.ts
   ```

From here on, every API call in Phase 4 goes through `fetchWithRetry`.

## Check yourself

1. Predict the output: `isRepeatable({ method: "post" })`, `isRepeatable({ method: "POST", headers: { "Idempotency-Key": "abc" } })` and `isRepeatable()`. Why the difference?
2. Predict the output: `parseRetryAfter("3", now)` and `parseRetryAfter("soon", now)`
3. With `baseDelayMs: 500` and `maxDelayMs: 8000`, predict `backoffDelay(3, …)` and `backoffDelay(5, …)` when `random` returns `1`, and `backoffDelay(2, …)` when it returns `0.5`.
4. Why add jitter (a random wait) instead of always waiting exactly 0.5 s, 1 s, 2 s?

<details><summary>Answers</summary>

1. `false`, `true`, `true`. Sending a `POST` twice could charge someone twice, so it's tried once. With an `Idempotency-Key` the server can spot the repeat, so it's safe. No `init` means a `GET`, which is safe to repeat.
2. `3000` (seconds, in milliseconds) and `null` (neither a number nor a date, so the normal backoff is used).
3. `4000` (500 × 2³), `8000` (500 × 2⁵ is 16,000, capped at the maximum) and `1000` (half of 2,000).
4. When a mast goes down, thousands of phones lose signal at once. With identical waits they'd all retry at the same instant and knock the server over again. Random waits spread them out.

</details>

## When you're stuck

- **The timeout never fires** — the signal has to be passed to `fetch` in its options: `fetchFn(url, { ...init, signal })`.
- **The retries all happen at once** — you forgot to `await` the sleep.
- **A cancelled request keeps retrying** — check `init.signal?.aborted` in the `catch` and rethrow straight away.
- **The loop runs one time too many or too few** — `retries: 3` means 4 attempts in total: the first, plus 3 retries.
- **Still stuck?** Read `solution/resilient.ts`, then close it and write your own from memory.
