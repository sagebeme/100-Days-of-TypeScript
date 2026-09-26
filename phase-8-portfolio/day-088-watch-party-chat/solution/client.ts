// The page. It runs in the browser: the server strips the types from this file (and the two it imports).
import { REACTIONS, type ChatLine, type Playback, type ServerMessage } from "./protocol.ts";
import { positionAt, formatPosition } from "./room.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let socket: WebSocket | null = null;
let me = "";
let playback: Playback = { playing: false, position: 0, updatedAt: 0, by: null };
let clockOffset = 0; // the server's clock minus ours, so everyone's stream is at the same place

const params = new URLSearchParams(location.search);
$<HTMLInputElement>("room").value = params.get("room") ?? "derby-night";
try {
  $<HTMLInputElement>("name").value = localStorage.getItem("watch-party-name") ?? "";
} catch {
  /* no storage: type it each time */
}

function send(message: object): void {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function addLine(line: ChatLine): void {
  const li = document.createElement("li");
  li.className = line.from === me ? "mine" : "";
  if (line.from !== me) li.append(Object.assign(document.createElement("span"), { className: "from", textContent: line.from }));
  li.append(document.createTextNode(line.text)); // text, never HTML: a message can't inject anything
  appendMessage(li);
}

function addNote(text: string): void {
  appendMessage(Object.assign(document.createElement("li"), { className: "note", textContent: text }));
}

function appendMessage(li: HTMLLIElement): void {
  const list = $("messages");
  const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  list.append(li);
  if (atBottom) list.scrollTop = list.scrollHeight; // don't yank people back down while they read old messages
}

function float(emoji: string): void {
  const el = Object.assign(document.createElement("span"), { className: "floater", textContent: emoji });
  el.style.left = `${10 + Math.random() * 80}%`;
  $("floaters").append(el);
  setTimeout(() => el.remove(), 2500);
}

function showPlayback(): void {
  $("toggle").textContent = playback.playing ? "Pause" : "Play";
  $("live").textContent = playback.playing ? "Live" : "Paused";
  $("live").classList.toggle("on", playback.playing);
  if (playback.by) $("synced").textContent = `${playback.by === me ? "You" : playback.by} ${playback.playing ? "pressed play" : "paused"} at ${formatPosition(playback.position)}`;
}

function onMessage(message: ServerMessage): void {
  switch (message.type) {
    case "welcome":
      me = message.you;
      playback = message.playback;
      clockOffset = message.serverTime - Date.now(); // phones' clocks drift: use the server's
      $("join-screen").hidden = true;
      $("party").hidden = false;
      $("room-title").textContent = $<HTMLInputElement>("room").value;
      $("people").textContent = `${message.people.length} watching: ${message.people.join(", ")}`;
      message.history.forEach(addLine);
      addNote(`You joined as ${me}`);
      showPlayback();
      $<HTMLInputElement>("text").focus();
      history.replaceState(null, "", `?room=${encodeURIComponent($<HTMLInputElement>("room").value)}`);
      break;
    case "joined":
    case "left":
      $("people").textContent = `${message.people.length} watching: ${message.people.join(", ")}`;
      if (message.name !== me) addNote(`${message.name} ${message.type === "joined" ? "joined" : "left"}`);
      break;
    case "chat":
      addLine(message.line);
      break;
    case "reaction":
      float(message.emoji);
      break;
    case "playback":
      playback = message.playback;
      showPlayback();
      break;
    case "error":
      ($("party").hidden ? $("join-error") : $("chat-error")).textContent = message.message;
      setTimeout(() => ($("chat-error").textContent = ""), 3000);
      break;
  }
}

$("join").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $<HTMLInputElement>("name").value;
  try {
    localStorage.setItem("watch-party-name", name);
  } catch {
    /* fine */
  }
  socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);
  socket.addEventListener("open", () => send({ type: "join", room: $<HTMLInputElement>("room").value, name }));
  socket.addEventListener("message", (event) => onMessage(JSON.parse(String(event.data))));
  socket.addEventListener("close", () => addNote("Disconnected. Reload to join again."));
  socket.addEventListener("error", () => ($("join-error").textContent = "Couldn't connect to the party."));
});

$("send").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $<HTMLInputElement>("text");
  if (!input.value.trim()) return;
  send({ type: "chat", text: input.value });
  input.value = "";
});

$("reactions").append(
  ...REACTIONS.map((emoji) => {
    const button = Object.assign(document.createElement("button"), { type: "button", textContent: emoji });
    button.setAttribute("aria-label", `React ${emoji}`);
    button.addEventListener("click", () => send({ type: "react", emoji }));
    return button;
  }),
);

const now = () => Date.now() + clockOffset;
$("toggle").addEventListener("click", () => send({ type: "playback", action: playback.playing ? "pause" : "play", position: positionAt(playback, now()) }));
$("back").addEventListener("click", () => send({ type: "playback", action: "seek", position: Math.max(0, positionAt(playback, now()) - 10) }));
$("forward").addEventListener("click", () => send({ type: "playback", action: "seek", position: positionAt(playback, now()) + 10 }));

setInterval(() => ($("clock").textContent = formatPosition(positionAt(playback, now()))), 250);
