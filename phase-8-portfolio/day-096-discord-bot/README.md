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
