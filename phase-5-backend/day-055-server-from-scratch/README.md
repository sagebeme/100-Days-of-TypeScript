# Day 55: A Server from Scratch — node:http

Watch the video: *(not recorded yet)*

## The brief

For a whole phase your code called other people's servers. Now you write one. Welcome to Phase 5, the backend.

Today's server answers a question every Nairobi commuter asks at 5:30 pm: how packed is the stage right now? Anyone can report the crowd at a stage, and anyone can check the latest report before they walk there.

```
$ curl localhost:3055/stages?route=33
{"stages":[{"id":"kencom","name":"Kencom","routes":["33","34","46"]},{"id":"railways",...}]}

$ curl -X POST localhost:3055/stages/kencom/reports -H 'Content-Type: application/json' -d '{"crowd":"packed"}'
{"id":"7822…","stageId":"kencom","crowd":"packed","at":"2026-10-05T14:30:07.488Z"}

$ curl -X DELETE localhost:3055/stages/kencom
{"error":"DELETE isn't allowed here"}
```

You'll build it with nothing but Node's built-in `http` module: no framework. Tomorrow you'll meet one (Hono), and you'll know exactly what it's doing for you, because you'll have written it yourself.

## What you'll use

- **`createServer((request, response) => …)`**: one function that gets every request
- **Routing**: matching a method and a path like `/stages/:id` to a handler, and pulling out `id`
- **Status codes that mean something**:

  | Code | Meaning |
  | --- | --- |
  | `200 OK` | Here's what you asked for |
  | `201 Created` | I made it (with a `Location` header saying where it lives) |
  | `400 Bad Request` | Your data is wrong |
  | `404 Not Found` | Nothing lives at that path |
  | `405 Method Not Allowed` | That path exists, but not for that method (with an `Allow` header listing what is) |
  | `413 Content Too Large` | Your body is too big |
  | `415 Unsupported Media Type` | I only take JSON |
  | `500 Internal Server Error` | My bug, not yours |

- **Reading a body safely**: it arrives as a stream of chunks. Check the content type, and count the bytes as they arrive, because a sender can lie about `Content-Length`
- **One place for errors**: throw an `HttpError(404, "…")` anywhere; the server turns it into a response. An unexpected error gets logged for you, and the client learns nothing about your code
- **Logging** every request with its status and time, and **graceful shutdown** on Ctrl+C

## Steps

1. `starter/http-kit.ts`: `HttpError` and `sendJson` are written. Write `readJson`, then `Router.find`.
2. `starter/app.ts`: `/health` and `/stages` are written. Add the stage detail, the report list and the report POST (the TODOs say exactly what each returns). Then write the request handler at the bottom: routing, 404 and 405, error handling and logging.
3. Run the tests. They start your server on a spare port and talk to it over real HTTP:

   ```bash
   npm test -- day-055
   ```

4. Run it and try it with `curl` (the commands are at the top of `main.ts`):

   ```bash
   node phase-5-backend/day-055-server-from-scratch/starter/main.ts
   ```

   Watch the log line appear in the first terminal for every request. Try the errors on purpose.

## When you're stuck

- **The request hangs forever** — a code path never calls `response.end()`. Every branch must send exactly one response.
- **`Error [ERR_HTTP_HEADERS_SENT]`** — you sent two responses. Return after `sendJson`, or throw instead.
- **`/stages/` doesn't match `/stages`** — split on `/` and drop empty parts, so trailing slashes don't matter.
- **The 405 has no `Allow` header** — collect the methods of every route whose path matched, even when the method didn't.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
