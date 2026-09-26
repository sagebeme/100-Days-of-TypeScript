// Already written: tell Discord about the commands. Run it once, and again whenever commands.ts changes.
//   DISCORD_APP_ID=… DISCORD_BOT_TOKEN=… DISCORD_GUILD_ID=… node phase-8-portfolio/day-096-discord-bot/starter/register.ts
// With a guild (server) id the commands appear straight away in that server; without one they're
// global, which can take a while.
import { COMMANDS } from "./commands.ts";

const { DISCORD_APP_ID, DISCORD_BOT_TOKEN, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_APP_ID || !DISCORD_BOT_TOKEN) {
  console.error("Set DISCORD_APP_ID and DISCORD_BOT_TOKEN (from the Discord developer portal).");
  process.exit(1);
}
const path = DISCORD_GUILD_ID ? `applications/${DISCORD_APP_ID}/guilds/${DISCORD_GUILD_ID}/commands` : `applications/${DISCORD_APP_ID}/commands`;
const response = await fetch(`https://discord.com/api/v10/${path}`, {
  method: "PUT",
  headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(COMMANDS),
});
console.log(response.ok ? `Registered ${COMMANDS.length} commands.` : `Discord said ${response.status}: ${await response.text()}`);
