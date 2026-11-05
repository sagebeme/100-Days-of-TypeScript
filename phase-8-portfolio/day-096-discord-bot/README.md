# Day 96: Tikiti Discord Bot

*A brief and a test suite. No walkthrough.*

## The brief

Kenyan event communities live in Discord servers and WhatsApp groups. Put Tikiti where the fans already are:

```
/events                        -> what's on: dates in your own time zone, prices, seats left
/event event: Jioni Ja…        -> suggestions as you type; then the details, a Buy button, "Remind me"
/checkin event: … code: T42-…  -> gate staff only, and only they see the answer: "Let them in. Amina."
```

The bot is an **interactions endpoint**: no always-connected gateway. Discord POSTs each slash command to your server, and your reply goes straight back in the response. It's a Hono app like Day 66, so it runs anywhere Day 65's server does.

## What's already written

- `discord.ts`: the interaction and response types, and `timestamp()` for `<t:…>` dates.
- `commands.ts` and `register.ts`: the three commands, and a script to register them with Discord.
- `tikiti.ts`: what the bot needs from the ticketing API, a client for Day 66's API, and a demo version with made-up events.
- `main.ts`: runs it.

## The rules (tested)

- **`verify.ts`: the signature.** Anyone can POST to your address. Discord signs each request with Ed25519 (the timestamp header followed by the raw body), and your application's public key checks it. Refuse anything unsigned, altered, signed by another key, or more than 5 minutes old or ahead. Refuse bad headers too; don't crash on them. Discord tests this itself: it won't save your endpoint unless a badly signed request gets a 401.
- **`bot.ts`: the answers.**
  - PING gets PONG.
  - `/events` is one embed, a line per event: a link, a date, the venue, the price and `seats(n)`. `seats(n)` gives "Sold out", "Only 12 left" or "412 left".
  - `/event` gets the details, a Buy link button, and a "Remind me" button. A sold-out event gets a disabled button instead of the Buy link.
  - Suggestions match the title or the venue as people type. Discord allows at most 25 suggestions, with names of at most 100 characters.
  - `/checkin` is for members with the staff role only. Anyone else never reaches Tikiti. It tidies the code people type, and its answer is visible only to the person who asked (`flags: 64`).
  - When Tikiti is down, say so privately, rather than leaving Discord to say "The application did not respond".
  - Mentions are always off: an event named `@everyone` pings nobody.
- **`app.ts`: the endpoint.** Read the raw body, verify it, then parse it and answer it.

## Steps

1. Read the tests, then the files under "What's already written", above all `discord.ts`.
2. `verify.ts`: check the headers' shape and the timestamp's age, then the Ed25519 signature. `npm test -- day-096 -t "signature"`.
3. `bot.ts`: `seats`, then `handleInteraction` for PING, `/events`, `/event`, suggestions, the reminder button and `/checkin`, with a catch for when Tikiti is down.
4. `app.ts`: read the raw body and the two headers, verify, then parse and answer. `npm test -- day-096 -t "endpoint"`.
5. Run the tests, then try it in a real Discord server (see "Try it for real").

## Done when

```bash
npm test -- day-096
```

## Try it for real

1. Create an application at [discord.com/developers](https://discord.com/developers/applications). Add a bot, and invite it to a test server with the `applications.commands` scope.
2. `DISCORD_APP_ID=… DISCORD_BOT_TOKEN=… DISCORD_GUILD_ID=… node phase-8-portfolio/day-096-discord-bot/starter/register.ts`
3. `DISCORD_PUBLIC_KEY=… STAFF_ROLE_ID=… node phase-8-portfolio/day-096-discord-bot/starter/main.ts`. Without `TIKITI_URL` it uses the demo events.
4. Expose port 3096 with a tunnel (`cloudflared tunnel --url http://localhost:3096`). Put `<tunnel address>/interactions` in the portal's **Interactions Endpoint URL**, and save.

The bot token and the public key are different things. The public key isn't secret. **The bot token is a password**: keep it in the environment, never in the code.

## Stretch

- Add a reminders route to Day 66, and a daily job that sends each person a DM the day before.
- Tikiti can be slow. Answer with a *deferred* response (type 5) straight away, then send the real reply by editing the original message through the webhook.
- Make Day 66's 409 answer include `checkedInAt`, so the bot can say when the ticket got in.

## Check yourself

1. Why does the bot check an Ed25519 signature on every request, and what does Discord do if a badly signed request doesn't get a 401?
2. Spot the bug: `app.ts` reads the body with `await c.req.json()`, then verifies `JSON.stringify(body)`. Why do good requests fail?
3. Predict the output: `seats(0)`, `seats(12)`, `seats(20)`, `seats(21)` and `seats(412)`
4. A fan (not staff) types `/checkin`. What happens, and why is the role checked before calling Tikiti?

<details><summary>Answers</summary>

1. Anyone can POST to the endpoint, so the signature is the only proof a request really came from Discord. Discord tests this itself and won't save the endpoint until a badly signed request is refused.
2. The signature covers the raw bytes exactly as sent. Parsing and re-stringifying can change spacing, key order or escapes, so the check fails. Read `c.req.text()`, verify, then parse.
3. `"Sold out"`, `"Only 12 left"`, `"Only 20 left"`, `"21 left"` and `"412 left"`.
4. They get a private refusal (`flags: 64`). Tikiti is never asked, so a fan can't use the bot to test ticket codes or let anyone in.

</details>

## When you're stuck

- **`verifyDiscordRequest` throws on a bad key or signature** — check the shapes before you touch `node:crypto`: a signature is 128 hex characters, a public key 64, a timestamp only digits. Return `false` for anything else.
- **`createPublicKey` won't take Discord's key** — Node wants it in DER `spki` form: `Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(publicKey, "hex")])` with `format: "der", type: "spki"`.
- **A good request fails to verify** — sign-check `timestamp + body` exactly as received. In `app.ts`, read the body with `c.req.text()`, not `c.req.json()`, which you'd then have to turn back into the same string.
- **Fans can check people in** — refuse when there's no `member` (a DM), when `staffRoleId` is empty, or when the member's `roles` don't include it. Do it before calling Tikiti.
- **The code isn't found** — trim it and uppercase it before calling `checkIn`.
- **Discord says "The application did not respond" when Tikiti is down** — wrap the Tikiti calls in `try`/`catch` and answer the private "isn't answering" message (or no choices, for suggestions).
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
