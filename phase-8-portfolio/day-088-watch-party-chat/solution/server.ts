import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
import { WebSocketServer, type WebSocket } from "ws";
import { Room } from "./room.ts";
import type { ClientMessage, ServerMessage } from "./protocol.ts";

// The server: serves the page over HTTP, and the rooms over WebSockets on the same port.
export function createPartyServer(options: { now?: () => number; publicDir?: string } = {}): { server: Server; rooms: Map<string, Room> } {
  const now = options.now ?? Date.now;
  const publicDir = options.publicDir ?? join(import.meta.dirname, "public");
  // The page's scripts are TypeScript, shared with the server: Node strips the types on the way out,
  // and the browser gets plain JavaScript. Only these files, nothing else from the folder.
  const SCRIPTS = new Set(["client.ts", "protocol.ts", "room.ts"]);
  const rooms = new Map<string, Room>();

  const server = createServer(async (req, res) => {
    const script = req.url?.slice(1) ?? "";
    if (SCRIPTS.has(script)) {
      const source = await readFile(join(import.meta.dirname, script), "utf8");
      return res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" }).end(stripTypeScriptTypes(source));
    }
    const file = req.url === "/" || req.url?.startsWith("/?") ? "index.html" : req.url?.slice(1) ?? "";
    const types: Record<string, string> = { html: "text/html; charset=utf-8", js: "text/javascript", css: "text/css" };
    if (!/^[\w-]+\.(html|js|css)$/.test(file)) return res.writeHead(404).end("Not found");
    try {
      res.writeHead(200, { "Content-Type": types[file.split(".").pop()!] }).end(await readFile(join(publicDir, file)));
    } catch {
      res.writeHead(404).end("Not found");
    }
  });

  const sockets = new WebSocketServer({ server, maxPayload: 4096 });
  const members = new Map<WebSocket, { room: Room; name: string }>(); // who each open socket is, and where
  const send = (to: WebSocket, message: ServerMessage) => {
    if (to.readyState === to.OPEN) to.send(JSON.stringify(message));
  };
  const everyone = (room: Room, message: ServerMessage) => {
    for (const [client, member] of members) if (member.room === room) send(client, message);
  };

  sockets.on("connection", (socket: WebSocket) => {
    socket.on("message", (data) => {
      let message: ClientMessage;
      try {
        message = JSON.parse(String(data));
      } catch {
        return send(socket, { type: "error", message: "That wasn't a message I understand" });
      }
      const member = members.get(socket);

      if (message.type === "join") {
        if (member) return send(socket, { type: "error", message: "You're already in a room" });
        const roomName = String(message.room ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40) || "lobby";
        const room = rooms.get(roomName) ?? new Room(roomName);
        rooms.set(roomName, room);
        const name = room.join(String(message.name ?? ""));
        members.set(socket, { room, name });
        send(socket, { type: "welcome", you: name, people: room.names, history: [...room.history], playback: room.playback, serverTime: now() });
        return everyone(room, { type: "joined", name, people: room.names });
      }
      if (!member) return send(socket, { type: "error", message: "Join a room first" });
      const { room, name } = member;

      if (message.type === "chat") {
        const result = room.chat(name, String(message.text ?? ""), now());
        return "error" in result ? send(socket, { type: "error", message: result.error }) : everyone(room, { type: "chat", line: result });
      }
      if (message.type === "react") {
        const result = room.react(name, String(message.emoji ?? ""));
        return "error" in result ? send(socket, { type: "error", message: result.error }) : everyone(room, { type: "reaction", ...result });
      }
      if (message.type === "playback") {
        const result = room.control(name, message.action, Number(message.position), now());
        return "error" in result ? send(socket, { type: "error", message: result.error }) : everyone(room, { type: "playback", playback: result });
      }
      send(socket, { type: "error", message: "That wasn't a message I understand" });
    });

    socket.on("close", () => {
      const member = members.get(socket);
      members.delete(socket);
      if (!member) return;
      member.room.leave(member.name);
      if (member.room.people.size === 0) rooms.delete(member.room.name); // an empty room is forgotten
      else everyone(member.room, { type: "left", name: member.name, people: member.room.names });
    });
  });

  return { server, rooms };
}

if (import.meta.main) {
  const { server } = createPartyServer();
  const port = Number(process.env.PORT ?? 3088);
  server.listen(port, () => console.log(`Watch party on http://localhost:${port}`));
}
