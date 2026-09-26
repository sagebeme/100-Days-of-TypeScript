import { createServer, type Server } from "node:http";
import { WebSocketServer } from "ws";
import { Room } from "./room.ts";

// Serve the page (public/, and client.ts, protocol.ts and room.ts with their types stripped) over
// HTTP, and the rooms over WebSockets on the same port. The tests are the spec.
export function createPartyServer(options: { now?: () => number; publicDir?: string } = {}): { server: Server; rooms: Map<string, Room> } {
  void options;
  const rooms = new Map<string, Room>();
  const server = createServer((_req, res) => res.writeHead(501).end("TODO"));
  void new WebSocketServer({ server });
  return { server, rooms };
}

if (import.meta.main) {
  const { server } = createPartyServer();
  const port = Number(process.env.PORT ?? 3088);
  server.listen(port, () => console.log(`Watch party on http://localhost:${port}`));
}
