// Already written: run the bot's interactions endpoint.
//   DISCORD_PUBLIC_KEY=… node phase-8-portfolio/day-096-discord-bot/starter/main.ts
// Discord needs a public https address: while developing, a tunnel (cloudflared, ngrok) to this port.
// Put <address>/interactions in the portal's "Interactions Endpoint URL". Discord sends a signed
// PING, and only saves the address if it gets a PONG back, and a 401 for a bad signature.
import { serve } from "@hono/node-server";
import { createApp } from "./app.ts";
import { demoTikiti, tikitiApi } from "./tikiti.ts";

const { DISCORD_PUBLIC_KEY, TIKITI_URL, TIKITI_COOKIE, STAFF_ROLE_ID, SITE_URL } = process.env;
if (!DISCORD_PUBLIC_KEY) {
  console.error("Set DISCORD_PUBLIC_KEY (the developer portal, General Information).");
  process.exit(1);
}
const tikiti = TIKITI_URL && TIKITI_COOKIE ? tikitiApi(TIKITI_URL, TIKITI_COOKIE) : demoTikiti();
const app = createApp({
  publicKey: DISCORD_PUBLIC_KEY,
  bot: { tikiti, staffRoleId: STAFF_ROLE_ID ?? "", siteUrl: SITE_URL ?? "https://tikiti.example" },
});
const port = Number(process.env.PORT ?? 3096);
serve({ fetch: app.fetch, port }, (info) => console.log(`Interactions endpoint on http://localhost:${info.port}/interactions${TIKITI_URL ? "" : " (demo events)"}`));
