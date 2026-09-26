import { describe, it, expect } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import { verifyDiscordRequest } from "./starter/verify.ts";
import { handleInteraction, seats, type BotOptions } from "./starter/bot.ts";
import { createApp } from "./starter/app.ts";
import { EPHEMERAL, type Interaction } from "./starter/discord.ts";
import type { CheckInResult, Tikiti, TikitiEvent } from "./starter/tikiti.ts";

// A key pair standing in for Discord's: we sign like Discord, the bot checks with the public half.
const { privateKey, publicKey: keyObject } = generateKeyPairSync("ed25519");
const publicKey = Buffer.from(keyObject.export({ format: "jwk" }).x!, "base64url").toString("hex");
const NOW = Date.parse("2026-12-01T09:00:00Z");
const nowSeconds = String(NOW / 1000);
const signed = (body: string, timestamp = nowSeconds) => ({ body, timestamp, signature: sign(null, Buffer.from(timestamp + body), privateKey).toString("hex") });

describe("checking Discord's signature", () => {
  it("accepts a request Discord signed", () => {
    expect(verifyDiscordRequest({ ...signed('{"type":1}'), publicKey, now: NOW })).toBe(true);
  });

  it("rejects a body changed after signing, even by one character", () => {
    const request = signed('{"type":1}');
    expect(verifyDiscordRequest({ ...request, body: '{"type":2}', publicKey, now: NOW })).toBe(false);
  });

  it("rejects a signature made with a different key", () => {
    const other = generateKeyPairSync("ed25519").privateKey;
    const signature = sign(null, Buffer.from(nowSeconds + "{}"), other).toString("hex");
    expect(verifyDiscordRequest({ body: "{}", timestamp: nowSeconds, signature, publicKey, now: NOW })).toBe(false);
  });

  it("rejects the timestamp being swapped, since it's part of what's signed", () => {
    const request = signed("{}");
    expect(verifyDiscordRequest({ ...request, timestamp: String(NOW / 1000 - 1), publicKey, now: NOW })).toBe(false);
  });

  it("rejects an old request replayed later, and one from the future", () => {
    const old = signed("{}", String(NOW / 1000 - 6 * 60));
    expect(verifyDiscordRequest({ ...old, publicKey, now: NOW })).toBe(false);
    const recent = signed("{}", String(NOW / 1000 - 4 * 60));
    expect(verifyDiscordRequest({ ...recent, publicKey, now: NOW })).toBe(true);
    const future = signed("{}", String(NOW / 1000 + 6 * 60));
    expect(verifyDiscordRequest({ ...future, publicKey, now: NOW })).toBe(false);
  });

  it("says no, rather than crashing, to missing or malformed headers", () => {
    const request = signed("{}");
    for (const bad of [
      { signature: undefined },
      { timestamp: undefined },
      { signature: "zz" + request.signature.slice(2) },
      { signature: request.signature.slice(0, 64) },
      { timestamp: "yesterday" },
    ]) {
      expect(verifyDiscordRequest({ ...request, ...bad, publicKey, now: NOW })).toBe(false);
    }
    expect(verifyDiscordRequest({ ...request, publicKey: "not-a-key", now: NOW })).toBe(false);
  });
});

const EVENTS: TikitiEvent[] = [
  { id: 1, title: "Jioni Jazz Night", venue: "Uhuru Gardens", startsAt: "2026-12-12T18:00:00+03:00", priceKes: 1000, seatsLeft: 412 },
  { id: 2, title: "Sauti za Pwani", venue: "Fort Jesus, Mombasa", startsAt: "2026-12-19T16:00:00+03:00", priceKes: 1500, seatsLeft: 12 },
  { id: 3, title: "Nairobi Comedy Store", venue: "Kenya National Theatre", startsAt: "2026-12-20T19:30:00+03:00", priceKes: 800, seatsLeft: 0 },
];

function fakeTikiti(overrides: Partial<Tikiti> = {}) {
  const calls: string[] = [];
  const tikiti: Tikiti = {
    upcomingEvents: async () => EVENTS,
    checkIn: async (eventId, code): Promise<CheckInResult> => {
      calls.push(`checkIn ${eventId} ${code}`);
      if (code === "T7-AAAAAAAAAAAAAAAA") return { status: "admitted", holder: "Amina" };
      if (code === "T8-BBBBBBBBBBBBBBBB") return { status: "used", at: "2026-12-12T19:02:00+03:00" };
      if (code === "T9-DDDDDDDDDDDDDDDD") return { status: "used", at: null };
      return { status: "invalid" };
    },
    remind: async (user, eventId) => void calls.push(`remind ${user} ${eventId}`),
    ...overrides,
  };
  return { tikiti, calls };
}

const STAFF = "role-gate";
const options = (tikiti: Tikiti): BotOptions => ({ tikiti, staffRoleId: STAFF, siteUrl: "https://tikiti.example" });
const member = (roles: string[] = []) => ({ user: { id: "u-99", username: "wanjiru" }, roles });
const command = (name: string, opts: Record<string, string | number> = {}, roles: string[] = []): Interaction => ({
  type: 2,
  id: "i-1",
  token: "t",
  guild_id: "g-1",
  member: member(roles),
  data: { name, options: Object.entries(opts).map(([n, value]) => ({ name: n, type: typeof value === "number" ? 4 : 3, value })) },
});

describe("seats left", () => {
  it("is honest about how many, and urgent only when it's true", () => {
    expect([seats(0), seats(-1), seats(12), seats(20), seats(21), seats(1412)]).toEqual(["Sold out", "Sold out", "Only 12 left", "Only 20 left", "21 left", "1,412 left"]);
  });
});

describe("the bot's answers", () => {
  it("answers Discord's PING with a PONG", async () => {
    expect(await handleInteraction({ type: 1, id: "p", token: "t" }, options(fakeTikiti().tikiti))).toEqual({ type: 1 });
  });

  it("/events: one embed, a line per event, with a link, a date in the reader's time zone, price and seats", async () => {
    const response = await handleInteraction(command("events"), options(fakeTikiti().tikiti));
    expect(response.type).toBe(4);
    if (response.type !== 4) return;
    expect(response.data.flags ?? 0).toBe(0); // everyone in the channel sees it
    expect(response.data.embeds).toHaveLength(1);
    const lines = response.data.embeds![0].description!.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("[Jioni Jazz Night](https://tikiti.example/events/1)");
    expect(lines[0]).toContain(`<t:${Date.parse("2026-12-12T18:00:00+03:00") / 1000}:f>`);
    expect(lines[0]).toContain("KES 1,000");
    expect(lines[1]).toContain("Only 12 left");
    expect(lines[2]).toContain("Sold out");
    expect(response.data.allowed_mentions).toEqual({ parse: [] }); // an event called "@everyone" pings nobody
  });

  it("/events says so when nothing's on sale", async () => {
    const response = await handleInteraction(command("events"), options(fakeTikiti({ upcomingEvents: async () => [] }).tikiti));
    expect(response).toMatchObject({ type: 4, data: { content: "Nothing on sale right now. Check back soon." } });
  });

  it("/event: the details, a Buy link and a reminder button", async () => {
    const response = await handleInteraction(command("event", { event: 1 }), options(fakeTikiti().tikiti));
    if (response.type !== 4) throw new Error("expected a message");
    const [embed] = response.data.embeds!;
    expect(embed).toMatchObject({ title: "Jioni Jazz Night", url: "https://tikiti.example/events/1", color: 0xc2410c });
    expect(embed.description).toContain("Uhuru Gardens");
    expect(embed.fields).toEqual([
      { name: "Price", value: "KES 1,000", inline: true },
      { name: "Seats", value: "412 left", inline: true },
    ]);
    expect(response.data.components).toEqual([
      {
        type: 1,
        components: [
          { type: 2, style: 5, label: "Buy tickets", url: "https://tikiti.example/events/1" },
          { type: 2, style: 2, label: "Remind me the day before", custom_id: "remind:1" },
        ],
      },
    ]);
  });

  it("/event for a sold-out event: a disabled button, not a link to a page that can't sell", async () => {
    const response = await handleInteraction(command("event", { event: 3 }), options(fakeTikiti().tikiti));
    if (response.type !== 4) throw new Error("expected a message");
    expect(response.data.components![0].components[0]).toMatchObject({ label: "Sold out", disabled: true });
  });

  it("/event for an event that isn't there: a private note", async () => {
    const response = await handleInteraction(command("event", { event: 99 }), options(fakeTikiti().tikiti));
    expect(response).toMatchObject({ type: 4, data: { flags: EPHEMERAL, content: expect.stringContaining("can't find that event") } });
  });

  it("suggests events as people type, matching the title or the venue", async () => {
    const typing = (value: string): Interaction => ({
      type: 4,
      id: "a",
      token: "t",
      data: { name: "event", options: [{ name: "event", type: 4, value, focused: true }] },
    });
    const bot = options(fakeTikiti().tikiti);
    expect(await handleInteraction(typing("jazz"), bot)).toEqual({ type: 8, data: { choices: [{ name: "Jioni Jazz Night · Uhuru Gardens", value: "1" }] } });
    const mombasa = await handleInteraction(typing("MOMBASA"), bot);
    expect(mombasa).toEqual({ type: 8, data: { choices: [{ name: "Sauti za Pwani · Fort Jesus, Mombasa", value: "2" }] } });
    const all = await handleInteraction(typing(""), bot);
    expect(all.type === 8 && all.data.choices.map((c) => c.value)).toEqual(["1", "2", "3"]);
  });

  it("never offers Discord more than 25 suggestions, or names longer than 100 characters", async () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ ...EVENTS[0], id: i + 1, title: `Night ${i + 1} ${"x".repeat(120)}` }));
    const response = await handleInteraction(
      { type: 4, id: "a", token: "t", data: { name: "event", options: [{ name: "event", type: 4, value: "night", focused: true }] } },
      options(fakeTikiti({ upcomingEvents: async () => many }).tikiti),
    );
    if (response.type !== 8) throw new Error("expected choices");
    expect(response.data.choices).toHaveLength(25);
    expect(Math.max(...response.data.choices.map((c) => c.name.length))).toBeLessThanOrEqual(100);
  });

  it("the reminder button signs the person up, and tells only them", async () => {
    const { tikiti, calls } = fakeTikiti();
    const response = await handleInteraction({ type: 3, id: "c", token: "t", member: member(), data: { custom_id: "remind:2" } }, options(tikiti));
    expect(calls).toEqual(["remind u-99 2"]);
    expect(response).toMatchObject({ type: 4, data: { flags: EPHEMERAL, content: "Done. I'll message you the day before." } });
  });
});

describe("/checkin at the gate", () => {
  it("lets a good ticket in, tidying the code people type", async () => {
    const { tikiti, calls } = fakeTikiti();
    const response = await handleInteraction(command("checkin", { event: 1, code: "  t7-aaaaaaaaaaaaaaaa " }, [STAFF]), options(tikiti));
    expect(calls).toEqual(["checkIn 1 T7-AAAAAAAAAAAAAAAA"]);
    expect(response).toMatchObject({ type: 4, data: { flags: EPHEMERAL, content: expect.stringContaining("Let them in") } });
    if (response.type === 4) expect(response.data.content).toContain("Amina");
  });

  it("stops a ticket that's already been used, saying when", async () => {
    const response = await handleInteraction(command("checkin", { event: 1, code: "T8-BBBBBBBBBBBBBBBB" }, [STAFF]), options(fakeTikiti().tikiti));
    if (response.type !== 4) throw new Error("expected a message");
    expect(response.data.content).toContain("Already used");
    expect(response.data.content).toContain(`<t:${Date.parse("2026-12-12T19:02:00+03:00") / 1000}:R>`);
    const unknownTime = await handleInteraction(command("checkin", { event: 1, code: "T9-DDDDDDDDDDDDDDDD" }, [STAFF]), options(fakeTikiti().tikiti));
    expect(unknownTime.type === 4 && unknownTime.data.content).toBe("⛔ **Already used.** This ticket has already got in.");
  });

  it("stops a code that isn't a ticket for this event", async () => {
    const response = await handleInteraction(command("checkin", { event: 1, code: "T9-CCCCCCCCCCCCCCCC" }, [STAFF]), options(fakeTikiti().tikiti));
    expect(response.type === 4 && response.data.content).toContain("Not a ticket for Jioni Jazz Night");
  });

  it("is only for gate staff, and never asks Tikiti for anyone else", async () => {
    const { tikiti, calls } = fakeTikiti();
    const fan = await handleInteraction(command("checkin", { event: 1, code: "T7-AAAAAAAAAAAAAAAA" }, ["role-fan"]), options(tikiti));
    expect(fan).toMatchObject({ data: { flags: EPHEMERAL, content: "Only gate staff can check people in." } });
    const inDm = await handleInteraction({ ...command("checkin", { event: 1, code: "x" }), member: undefined, user: { id: "u", username: "u" } }, options(tikiti));
    expect(inDm.type === 4 && inDm.data.flags).toBe(EPHEMERAL);
    const noRoleSet = await handleInteraction(command("checkin", { event: 1, code: "x" }, [""]), { ...options(tikiti), staffRoleId: "" });
    expect(noRoleSet.type === 4 && noRoleSet.data.content).toBe("Only gate staff can check people in.");
    expect(calls).toEqual([]);
  });
});

describe("when Tikiti is down", () => {
  const down = fakeTikiti({
    upcomingEvents: async () => {
      throw new Error("ECONNREFUSED");
    },
  }).tikiti;

  it("tells the person privately instead of leaving Discord to say 'The application did not respond'", async () => {
    expect(await handleInteraction(command("events"), options(down))).toEqual({
      type: 4,
      data: { content: "Tikiti isn't answering right now. Try again in a minute.", flags: EPHEMERAL, allowed_mentions: { parse: [] } },
    });
  });

  it("offers no suggestions, rather than an error", async () => {
    const response = await handleInteraction({ type: 4, id: "a", token: "t", data: { name: "event", options: [{ name: "event", type: 4, value: "j", focused: true }] } }, options(down));
    expect(response).toEqual({ type: 8, data: { choices: [] } });
  });
});

describe("the interactions endpoint", () => {
  const app = createApp({ publicKey, bot: options(fakeTikiti().tikiti), now: () => NOW });
  const post = (body: string, headers: Record<string, string>) => app.request("/interactions", { method: "POST", body, headers: { "Content-Type": "application/json", ...headers } });

  it("answers a signed PING with a PONG, which is how Discord checks your address", async () => {
    const { body, timestamp, signature } = signed(JSON.stringify({ type: 1, id: "p", token: "t" }));
    const response = await post(body, { "X-Signature-Ed25519": signature, "X-Signature-Timestamp": timestamp });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: 1 });
  });

  it("answers 401 to anything unsigned or badly signed (Discord tests this too)", async () => {
    const body = JSON.stringify({ type: 1, id: "p", token: "t" });
    expect((await post(body, {})).status).toBe(401);
    const { signature, timestamp } = signed(body);
    expect((await post(body.replace("1", "2"), { "X-Signature-Ed25519": signature, "X-Signature-Timestamp": timestamp })).status).toBe(401);
  });

  it("runs a signed command", async () => {
    const { body, timestamp, signature } = signed(JSON.stringify(command("events")));
    const response = await post(body, { "X-Signature-Ed25519": signature, "X-Signature-Timestamp": timestamp });
    expect(await response.json()).toMatchObject({ type: 4, data: { embeds: [{ title: "What's on" }] } });
  });
});
