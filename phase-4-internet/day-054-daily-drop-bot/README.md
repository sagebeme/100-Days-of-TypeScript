# Day 54: Daily Drop Bot — Phase 4 Capstone

Watch the video: *(not recorded yet)*

## The brief

Build the thing you'd actually use every morning: a bot that sends you one message at 07:00 with everything you care about today. The weather and what to wear, your team's next match, and the new music that dropped this week. It arrives on Telegram, like a message from a friend who's already checked everything.

```
Habari! Here's your drop for Saturday 3 October.

WEATHER
16°C now with some cloud, 15-29°C today, 20% chance of rain.
Cold morning, hot afternoon: wear layers.

GOR MAHIA
Next up: Gor Mahia vs AFC Leopards, Sun 4 Oct, 15:00 at Nyayo National Stadium (FKF Premier League).

NEW MUSIC THIS WEEK
- Bien: Made-Up Single (single)
- Nyashinski: Practice Track (single)
- Nviiri the Storyteller: Sample EP (EP)
```

The weather is live, from Open-Meteo. The fixtures and releases in `fixtures.json` and `releases.json` are made up for practice; point `FIXTURES_SOURCE` or `RELEASES_SOURCE` at a URL to use real feeds.

This day uses most of Phase 4 together:

| From | What it does here |
| --- | --- |
| Day 43 | Calls a REST API and handles its status codes |
| Day 44 | Checks every source with a Zod schema |
| Day 45 | Checks the config at start-up and keeps the token in `.env` |
| Day 46 | Schedules by Nairobi time |
| Day 48 | Retries a flaky connection (`fetchWithRetry` in `main.ts`) |
| Day 53 | One small client per service, with clear errors |

## The new idea: failing gracefully

A bot with three sources has three ways to fail every morning. If the music feed is down, you still want the weather. So the sources load **at the same time** with `Promise.allSettled`, which waits for all of them and tells you which succeeded, instead of `Promise.all`, which gives up at the first failure. Each one becomes a `Section`: either its value, or a reason it's missing. The message always goes out:

```
NEW MUSIC THIS WEEK
Unavailable today (Gave up after 4 attempts: fetch failed).
```

## Steps

1. `starter/sources.ts`: `load(source, schema, fetch, readFile)`, for URLs or local files.
2. `starter/digest.ts`: `toSection`, `nextMatch`, `thisWeeksReleases` and `formatDigest`. `sky` and `fitTip` are written.
3. `starter/telegram.ts`: `fitToLimit` and `telegramMessenger`. The bot token is part of Telegram's URL, so never log that URL or put it in an error.
4. `starter/bot.ts`: the config is written. Write `sendDigest` (with `Promise.allSettled`), `nextRunAt` and `runDaily`.
5. Run the tests:

   ```bash
   npm test -- day-054
   ```

6. Get a drop now, printed in your terminal:

   ```bash
   node phase-4-internet/day-054-daily-drop-bot/starter/main.ts --now
   ```

## Sending it to Telegram

1. In Telegram, message **@BotFather**, send `/newbot`, and follow the steps. It gives you a token like `123456:ABC-…`.
2. Send your new bot any message, then open `https://api.telegram.org/bot<your token>/getUpdates` in a browser and find `"chat":{"id":…}`. That number is your chat id.
3. In `starter/.env`:

   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-your-token
   TELEGRAM_CHAT_ID=your-chat-id
   TEAM=Gor Mahia
   SEND_AT=07:00
   ```

4. `--now` sends one straight away. Without it, the bot keeps running and sends one every day at `SEND_AT`. To keep it running when your laptop is off, it needs a server: that's Phase 5.

## When you're stuck

- **One failing source stops the whole message** — you used `Promise.all`. Use `Promise.allSettled`, and turn each result into a section.
- **The sources load one after another** — you `await`ed them one at a time. Start all three first, then wait for them together.
- **The drop comes at 04:00 or 10:00** — you mixed up UTC and Nairobi time. `SEND_AT` is Nairobi time, which is UTC+3.
- **`Bad Request: chat not found`** — the chat id is wrong, or you haven't sent your bot a message yet (bots can't start conversations).
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.

## Phase 4 is done

You can now talk to other people's servers safely: REST and status codes, runtime validation, secrets, scheduling, email, SMS, retries, polite scraping, browser automation, M-Pesa payments, and packaging your own SDK. Phase 5 turns it around: you build the server.
