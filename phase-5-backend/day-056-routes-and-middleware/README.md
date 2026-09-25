# Day 56: Routes and Middleware — Hono

Watch the video: *(not recorded yet)*

## The brief

Yesterday you wrote a router, a body reader, an error handler and a logger by hand. Today you rebuild the same stage API on **[Hono](https://hono.dev)**, a small, fast web framework, and most of that code disappears. What's left is the part that's really yours: the routes, and a few pieces of **middleware**.

Middleware is code that runs around every request: before your route handler, after it, or both. Today you write three:

- **`requestId`**: gives every request an id and sends it back in an `X-Request-Id` header. When a user says "it broke", the id in their error finds the exact line in your logs.
- **`logRequests`**: one log line per request, with its status and how long it took.
- **`handleError`**: every error, from anywhere, becomes the same JSON shape. Real bugs are logged for you and hidden from the client.

And you plug in two that Hono ships with: **CORS** (which websites may call your API from a browser) and **a body-size limit**.

```
id-3 GET /stages 200 3.9ms
id-4 POST /stages/kencom/reports 201 2.8ms
id-5 POST /stages/kencom/reports 413 0.6ms
```

## What you'll use

- `new Hono()`, `app.get` / `app.post`, `c.req.param("id")`, `c.req.query("q")`, `c.json(body, status)`
- **Routers inside routers**: `app.route("/stages", stageRoutes(...))`, so a big API is many small files
- **`await next()`**: code before it runs on the way in, code after it runs on the way out, like layers of an onion
- **Typed context**: `Hono<{ Variables: { requestId: string } }>` means `c.get("requestId")` is a `string`, not `any`
- **`HTTPException`**: throw it anywhere, with a status and a message
- **`app.request()`**: send a request to your app *without* starting a server. Tests become fast and simple

## Steps

1. `starter/middleware.ts`: `requestId`, `logRequests` and `handleError`.
2. `starter/app.ts`: add the missing stage routes, then wire up `createApp`: middleware in the order the TODO gives, the `/stages` routes, `notFound` and `onError`.
3. Run the tests. There's no server and no port: every test is `app.request(...)`:

   ```bash
   npm test -- day-056
   ```

4. Run it on a real port and look at the headers:

   ```bash
   node phase-5-backend/day-056-routes-and-middleware/starter/main.ts
   curl -i localhost:3056/stages/kencom
   ```

## Things to notice

- **Order matters.** `requestId` runs first, so every later middleware and handler can use the id. Move `logRequests` above it and the log lines lose their ids.
- **Hono answers a wrong method with 404**, where your Day 55 server gave a 405 with an `Allow` header. Frameworks make choices for you. (Hono has a `method-not-allowed` middleware if you want the 405 back.)
- **CORS is a browser rule, not security.** It stops *other websites* from calling your API through a visitor's browser. `curl` ignores it completely, so never rely on it to protect anything.

## When you're stuck

- **`c.get("requestId")` is `undefined`** — the middleware that sets it isn't added before the route, or you called `app.use` after `app.route`.
- **The log line shows status 200 for an error** — you logged before `await next()`. The status is only known on the way out.
- **Errors come back as plain text** — `app.onError(...)` is missing, so Hono uses its default.
- **The CORS test fails** — the origin must match exactly: `http://localhost:5173`, with no trailing slash.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
