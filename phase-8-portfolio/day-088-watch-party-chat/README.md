# Day 88: Watch-Party Chat

*A brief and a test suite. No walkthrough.*

## The brief

The derby is on, and your friends are spread across Nairobi, Mombasa and Kisumu. Build a **watch party**: everyone joins a party by name, chats, fires emoji reactions that float up the screen, and shares one match clock. When anyone presses play, pause or skip, everyone's clock follows.

Real-time means **WebSockets**: one connection per person that stays open, so the server can push messages the moment they happen.

`protocol.ts` (every message, both ways) and the page in `public/` are written. Build the room, the server, and the page's script.

## The room (tested, no sockets)

- Unique names: a second "Amina" becomes "Amina 2". Names and messages come from strangers, so remove control characters and runs of spaces, and keep names to 20 characters ("Guest" if nothing's left).
- Chat lines are numbered. Newcomers get the latest 50. Refuse empty messages, messages over 500 characters, more than 5 messages in 5 seconds from one person ("Slow down a little"), and anyone not in the room.
- Only the offered reactions.
- **One stream for everyone**: keep `{ playing, position, updatedAt, by }`. Where it is *now* is `position` plus the time since `updatedAt`, if it's playing.

## The server (tested, over real sockets)

- One port for both: the page over HTTP, and the rooms over WebSockets (the `ws` package; Node's built-in `WebSocket` is the client in the tests).
- `join` answers the joiner with `welcome` (their name, who's there, the history, the stream, and the **server's time**: phones' clocks drift). Everyone in the room, the joiner included, then hears `joined`.
- Chat, reactions and the stream go to everyone in *that* room, the sender included. Problems go only to the sender, as an `error` message. So does anything that isn't JSON, and anything before joining.
- When someone disconnects, the room hears `left`. An empty room is forgotten.
- Serve `client.ts`, `protocol.ts` and `room.ts` as JavaScript with their types stripped (`stripTypeScriptTypes` from `node:module`), so the page shares the server's code. Serve nothing else from the folder.

## Steps

1. Read the tests, then `protocol.ts` for every message the server sends and receives.
2. `room.ts`: `cleanName`, `cleanText` and `formatPosition`, then the `Room` class (`join`, `leave`, `names`, `chat`, `react`, `control`) and `positionAt`. `npm test -- day-088 -t "a room"` and `-t "the shared stream"`.
3. `server.ts`: serve the page and the three scripts over HTTP, then handle `join`, chat, reactions, playback and disconnects over WebSockets.
4. `client.ts`: the page's script, using the same `protocol.ts` types.
5. Run the tests, then open it in two browser windows (the commands under "Done when").

## Done when

```bash
npm test -- day-088
node phase-8-portfolio/day-088-watch-party-chat/starter/server.ts
```

Open it in two browser windows and chat with yourself.

## Stretch

- Reconnect automatically after a dropped connection, and catch up on what was missed.
- Typing indicators ("Baraka is typing…").
- Deploy it (Day 65), and watch a real match with friends.

## When you're stuck

- **A name ends in a space after cutting it to 20 characters** — trim again after `slice(0, 20)`. Remove control characters (`/\p{Cc}/gu`, which includes newlines) before squeezing the spaces.
- **"Slow down" fires too early or never lifts** — keep each person's recent message times, drop the ones older than `RATE.perMs`, and refuse when `RATE.messages` are left.
- **The stream position is wrong for someone who joins late** — store `{ playing, position, updatedAt }`, never a running clock. `positionAt` adds `(now - updatedAt) / 1000` only while playing.
- **`Derby-Night` and `derby-night` are different rooms** — normalise the room name (lowercase) before looking it up in `rooms`.
- **The joiner never gets `joined`** — send `welcome` to them first, then `joined` to everyone in the room, them included.
- **`rooms.size` isn't 0 after everyone leaves** — on the socket's `close`, leave the room, tell the others `left`, and delete the room from the map once it's empty.
- **`/../package.json` or `server.ts` gets served** — never join the raw address onto a folder. Serve the three scripts by name from a fixed list, and from `public/` only plain names like `style.css` (letters, digits and dashes, then `.html`, `.css` or `.js`). Everything else is a 404.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
