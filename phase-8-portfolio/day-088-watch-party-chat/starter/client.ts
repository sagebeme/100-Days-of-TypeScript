// The page's script: yours to write. It runs in the browser, so the server strips its types.
// public/index.html has the markup and public/style.css the look: join, then chat, react and control
// the stream, all over one WebSocket.
import type { ServerMessage } from "./protocol.ts";

const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);
socket.addEventListener("message", (event) => console.log(JSON.parse(String(event.data)) as ServerMessage));
