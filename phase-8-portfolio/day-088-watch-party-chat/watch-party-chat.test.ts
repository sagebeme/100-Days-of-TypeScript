import { describe, it, expect, afterEach } from "vitest";
import type { AddressInfo } from "node:net";
import { Room, positionAt, cleanName, cleanText, formatPosition, HISTORY, RATE } from "./starter/room.ts";
import { createPartyServer } from "./starter/server.ts";
import type { ServerMessage } from "./starter/protocol.ts";

describe("a room", () => {
  it("gives everyone a unique name", () => {
    const room = new Room("derby");
    expect([room.join("Amina"), room.join("Amina"), room.join("  Amina  "), room.join("")]).toEqual(["Amina", "Amina 2", "Amina 3", "Guest"]);
    room.leave("Amina 2");
    expect(room.names).toEqual(["Amina", "Amina 3", "Guest"]);
  });

  it("cleans what strangers type", () => {
    expect(cleanName("  Bara\u0000ka \n the   Great and Magnificent ")).toBe("Baraka the Great and");
    expect(cleanText("  hello \u0007  there \t\t!  ")).toBe("hello there !");
  });

  it("keeps chat lines, numbered, and only the latest for newcomers", () => {
    const room = new Room("derby");
    room.join("Amina");
    const line = room.chat("Amina", "  Goal!!  ", 1000);
    expect(line).toEqual({ id: 1, from: "Amina", text: "Goal!!", at: 1000 });
    for (let i = 0; i < 60; i++) room.chat("Amina", `msg ${i}`, 10_000 + i * RATE.perMs);
    expect(room.history).toHaveLength(HISTORY);
    expect(room.history.at(-1)?.text).toBe("msg 59");
  });

  it("refuses empty, too long, too fast, and from people not in the room", () => {
    const room = new Room("derby");
    room.join("Amina");
    expect(room.chat("Amina", "   ", 0)).toEqual({ error: "Say something first" });
    expect(room.chat("Amina", "x".repeat(501), 0)).toEqual({ error: "Keep it under 500 characters" });
    expect(room.chat("Nobody", "hi", 0)).toEqual({ error: "Join the room first" });
    for (let i = 0; i < RATE.messages; i++) expect("id" in room.chat("Amina", `m${i}`, i * 100)).toBe(true);
    expect(room.chat("Amina", "one more", 900)).toEqual({ error: "Slow down a little" });
    expect("id" in room.chat("Amina", "later", RATE.perMs + 100)).toBe(true);
  });

  it("allows only the offered reactions", () => {
    const room = new Room("derby");
    room.join("Amina");
    expect(room.react("Amina", "🔥")).toEqual({ from: "Amina", emoji: "🔥" });
    expect(room.react("Amina", "💩")).toEqual({ error: "That reaction isn't available" });
  });
});

describe("the shared stream", () => {
  it("knows where it is now, whoever last pressed a button", () => {
    const room = new Room("derby");
    room.join("Amina");
    room.join("Baraka");
    room.control("Amina", "play", 0, 1000);
    expect(positionAt(room.playback, 61_000)).toBe(60);
    room.control("Baraka", "pause", 60, 61_000);
    expect(positionAt(room.playback, 999_000)).toBe(60);
    room.control("Amina", "seek", 600, 70_000);
    expect(room.playback).toEqual({ playing: false, position: 600, updatedAt: 70_000, by: "Amina" });
    expect(room.control("Amina", "seek", -5, 0)).toEqual({ error: "That isn't a place in the stream" });
  });

  it("shows positions as match clocks", () => {
    expect([formatPosition(0), formatPosition(725.9), formatPosition(3725)]).toEqual(["0:00", "12:05", "1:02:05"]);
  });
});

describe("the server, over real WebSockets", () => {
  let close: () => Promise<void> = async () => {};
  afterEach(() => close());

  async function start() {
    let clock = 1_000_000;
    const { server, rooms } = createPartyServer({ now: () => clock });
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const url = `ws://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const sockets: WebSocket[] = [];
    close = async () => {
      sockets.forEach((s) => s.close());
      await new Promise<void>((resolve) => server.close(() => resolve()));
    };
    // A person: a socket, and everything the server has sent them.
    const person = async () => {
      const socket = new WebSocket(url);
      sockets.push(socket);
      const inbox: ServerMessage[] = [];
      socket.addEventListener("message", (e) => inbox.push(JSON.parse(String(e.data))));
      await new Promise((resolve) => socket.addEventListener("open", resolve));
      const next = async (type: ServerMessage["type"]) => {
        for (let i = 0; i < 100; i++) {
          const found = inbox.findIndex((m) => m.type === type);
          if (found !== -1) return inbox.splice(found, 1)[0];
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        throw new Error(`No ${type} message arrived`);
      };
      return { socket, send: (m: object) => socket.send(JSON.stringify(m)), next, inbox };
    };
    return { url, rooms, person, tick: (ms: number) => void (clock += ms), port: (server.address() as AddressInfo).port };
  }

  it("welcomes people, tells the room who joined, and passes chat to everyone", async () => {
    const { person } = await start();
    const amina = await person();
    amina.send({ type: "join", room: "Derby-Night", name: "Amina" });
    expect(await amina.next("welcome")).toMatchObject({ you: "Amina", people: ["Amina"], history: [] });
    expect(await amina.next("joined")).toMatchObject({ name: "Amina" }); // everyone hears about a join, the joiner too

    const baraka = await person();
    baraka.send({ type: "join", room: "derby-night", name: "Baraka" });
    await baraka.next("welcome");
    expect(await amina.next("joined")).toEqual({ type: "joined", name: "Baraka", people: ["Amina", "Baraka"] });

    amina.send({ type: "chat", text: "Kick-off!" });
    const heard = await baraka.next("chat");
    expect(heard).toMatchObject({ line: { from: "Amina", text: "Kick-off!" } });
    expect(await amina.next("chat")).toEqual(heard); // the sender hears it too
  });

  it("gives newcomers the history, and where the stream is", async () => {
    const { person, tick } = await start();
    const amina = await person();
    amina.send({ type: "join", room: "derby", name: "Amina" });
    await amina.next("welcome");
    amina.send({ type: "chat", text: "Early!" });
    amina.send({ type: "playback", action: "play", position: 30 });
    await amina.next("playback");
    tick(5000);
    const late = await person();
    late.send({ type: "join", room: "derby", name: "Late" });
    const welcome = await late.next("welcome");
    expect(welcome).toMatchObject({ history: [{ text: "Early!" }], playback: { playing: true, position: 30, by: "Amina" } });
    if (welcome.type === "welcome") expect(positionAt(welcome.playback, welcome.serverTime)).toBe(35);
  });

  it("tells people who left, and forgets empty rooms", async () => {
    const { person, rooms } = await start();
    const amina = await person();
    const baraka = await person();
    amina.send({ type: "join", room: "derby", name: "Amina" });
    await amina.next("welcome");
    baraka.send({ type: "join", room: "derby", name: "Baraka" });
    await baraka.next("welcome");
    baraka.socket.close();
    expect(await amina.next("left")).toEqual({ type: "left", name: "Baraka", people: ["Amina"] });
    amina.socket.close();
    for (let i = 0; i < 50 && rooms.size; i++) await new Promise((r) => setTimeout(r, 10));
    expect(rooms.size).toBe(0);
  });

  it("keeps rooms apart, and answers nonsense with an error", async () => {
    const { person } = await start();
    const a = await person();
    const b = await person();
    a.send({ type: "join", room: "one", name: "A" });
    b.send({ type: "join", room: "two", name: "B" });
    await a.next("welcome");
    await b.next("welcome");
    a.send({ type: "chat", text: "only for room one" });
    await a.next("chat");
    await new Promise((r) => setTimeout(r, 50));
    expect(b.inbox.some((m) => m.type === "chat")).toBe(false);
    b.socket.send("{not json");
    expect(await b.next("error")).toEqual({ type: "error", message: "That wasn't a message I understand" });
    const stranger = await person();
    stranger.send({ type: "chat", text: "hi" });
    expect(await stranger.next("error")).toEqual({ type: "error", message: "Join a room first" });
  });

  it("serves the page, and its scripts as JavaScript, but no other files", async () => {
    const { port } = await start();
    const page = await fetch(`http://127.0.0.1:${port}/`);
    expect(await page.text()).toContain("Watch Party");
    const script = await fetch(`http://127.0.0.1:${port}/client.ts`);
    expect(script.headers.get("content-type")).toContain("javascript");
    expect(await script.text()).not.toMatch(/\bas HTMLInputElement\b|: string\b/); // types gone
    expect((await fetch(`http://127.0.0.1:${port}/server.ts`)).status).toBe(404);
    expect((await fetch(`http://127.0.0.1:${port}/../package.json`)).status).toBe(404);
  });
});
