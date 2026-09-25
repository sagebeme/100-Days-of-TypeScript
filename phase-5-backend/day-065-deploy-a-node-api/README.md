# Day 65: Deploy a Node API — Environments, Logs, Health and Shutdown

Watch the video: *(not recorded yet)*

## The brief

Your API runs on your laptop. Tomorrow's capstone has to run on a server on the internet, all day, through deploys, crashes and restarts, while you're asleep. Today you build the parts that make that safe. They're the same for every Node app you'll ever deploy.

```
$ NODE_ENV=production node phase-5-backend/day-065-deploy-a-node-api/starter/main.ts
Bad configuration:
  SESSION_SECRET: set a random secret of at least 32 characters
  DATABASE_PATH: say where the database file lives (on a persistent disk)
  CORS_ORIGIN: set your website's https:// address

$ node phase-5-backend/day-065-deploy-a-node-api/starter/main.ts
{"time":"2026-10-05T09:00:00.000Z","level":"info","msg":"Listening","port":3000,"environment":"development"}
{"time":"2026-10-05T09:00:01.918Z","level":"info","msg":"request","requestId":"c481…","method":"GET","path":"/","status":200,"ms":1}
^C{"time":"…","level":"info","msg":"Shutting down","reason":"SIGINT","timeoutMs":10000}
{"time":"…","level":"info","msg":"Stopped cleanly"}
```

## What you'll build, and why

1. **Config per environment** (`config.ts`). Development gets friendly defaults. Tests get an in-memory database. Production gets *no* defaults for anything dangerous, and **refuses to start** if a secret is missing, weak, or is the development one. A server that won't start is an obvious, 30-second fix; a server running with a guessable secret is a disaster nobody notices.
2. **Structured logs** (`logger.ts`). One JSON object per line, with a level. The hosting platform can search them ("every 500 in the last hour") in a way it can't search `console.log("here!!")`. Every request's lines share a request id, and anything named like a password, secret, token or cookie is **redacted automatically**, however deeply nested.
3. **Health checks** (`app.ts`). *Liveness* (`/health/live`) says the process is running; if it stops answering, the platform restarts the app. *Readiness* (`/health/ready`) says whether to send traffic here: not while shutting down, and not if the database is broken.
4. **Graceful shutdown** (`shutdown.ts`). A deploy stops your app with `SIGTERM`. Stopping on the spot cuts off people halfway through buying a ticket. Instead: stop taking new requests, let the current ones finish (up to a limit), close the database, then exit.

`main.ts` (already written) shows the order everything starts and stops in. `Dockerfile` packages it all.

## Steps

1. `starter/config.ts`: the schema and defaults are written. Add the production rules.
2. `starter/logger.ts`: `redact` and `createLogger`.
3. `starter/shutdown.ts`: `gracefulShutdown`.
4. `starter/app.ts`: the two health checks.
5. Run the tests. The shutdown tests start a real server with slow requests:

   ```bash
   npm test -- day-065
   ```

6. Run it, press Ctrl+C, and read the last two log lines.

## Deploying it

The `Dockerfile` builds an image that runs anywhere containers run. One way to put it online, with [Render](https://render.com):

1. Push the repo to GitHub.
2. In Render, create a **Web Service** from your repo. Choose **Docker**, and set the Dockerfile path to `phase-5-backend/day-065-deploy-a-node-api/starter/Dockerfile`.
3. Add the environment variables: `NODE_ENV=production`, a `SESSION_SECRET` (generate one with `node -e "console.log(crypto.randomBytes(32).toString('base64url'))"`), `DATABASE_PATH=/data/app.db`, and `CORS_ORIGIN` set to your website's address.
4. Set the health check path to `/health/ready`.

**About the database file.** SQLite keeps everything in one file, so that file must live on a *persistent disk* that survives deploys, mounted at `/data`. Many hosts' free plans have no persistent disk and wipe the filesystem on every deploy, which would wipe your data too. Check your host's current plans before you trust real data to it. The other common choice is a hosted database, which Phase 6 doesn't need but real projects often do.

## When you're stuck

- **Shutdown always hits the timeout** — keep-alive connections. After a request finishes, its connection stays open and idle; `server.close()` waits for it. Keep calling `closeIdleConnections()` while you wait.
- **A password shows up in the logs** — check `redact` goes into nested objects *and* arrays, and matches the key case-insensitively.
- **Readiness says "ready" while shutting down** — check `isShuttingDown()` first, before the database.
- **Production starts with no secret** — the production checks must run after parsing, and throw every problem at once.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
