# Day 61: Sign-up and Login — Password Hashing and Sessions

Watch the video: *(not recorded yet)*

## The brief

From here on, the ticketing platform needs to know who's asking: who bought which ticket, who's allowed to create events. Today you build accounts: sign up, log in, stay logged in, log out.

This is the most copied, most often wrong part of any backend, so today is about doing it properly, with the reasons written down:

```
POST /signup   { email, name, password }  ->  201, and you're logged in (a cookie)
POST /login    { email, password }        ->  200 and a cookie, or 401 "Email or password is wrong"
GET  /me                                  ->  who you are, or 401 "Log in first"
POST /logout                              ->  204, the cookie is cleared and the session is gone
```

In **Part 2** you build the other common way to stay logged in, **JSON Web Tokens (JWTs)** with refresh tokens, and learn when to choose which. It's what most mobile apps and many single-page apps use, and it's full of traps.

## The rules, and why

**Passwords**
- **Never store a password.** Store a *hash*: a one-way fingerprint. Checking a login means hashing what was typed and comparing.
- **Use a slow hash on purpose.** `scrypt` (built into Node) takes a noticeable moment and lots of memory. Nobody notices it on one login; an attacker trying a billion guesses against a stolen database does.
- **Salt every password.** A random salt makes two users with the same password get different hashes, so one cracked password doesn't reveal the others.
- **Compare with `timingSafeEqual`**, which takes the same time whether the first character matches or not.
- **Useful rules for a password**: long enough (10+), not a well-known one, and not built from the person's own name or email. No "must contain a symbol" rules: they make passwords harder to remember, not harder to guess.

**Sessions**
- After login, the browser gets a **random token** in a cookie. 32 random bytes can't be guessed.
- The database stores a **hash of the token**, so a leaked database can't be used to log in as anyone.
- The cookie is **`HttpOnly`** (JavaScript on the page can't read it, so an XSS bug can't steal it), **`Secure`** (HTTPS only), and **`SameSite=Lax`** (not sent along when another site submits a form to yours, which blocks CSRF).
- Sessions **expire** (30 days here), and logging out deletes the session on the server, not just the cookie.

**Login errors**
- "No account with that email" tells an attacker which emails have accounts. So a wrong password and an unknown email get **exactly the same answer**, and take the same time: when the email is unknown, the code still hashes a dummy password.

## Part 2: tokens (JWT, access and refresh)

### What a JWT is

A JWT is three pieces of base64url text joined by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOiIxIiwibmFtZSI6IkFtaW5hIi... . 3q2-Yv0r...
            header                                  payload (the claims)            signature
```

- **Header**: `{"alg":"HS256","typ":"JWT"}`, which algorithm signed it.
- **Payload**: the *claims*. Standard ones are `sub` (who it's about), `iat` (issued at) and `exp` (expires at), both in **seconds** since 1970. You can add your own, like `name` and `role`.
- **Signature**: HMAC-SHA256 of `header.payload` using a secret only the server knows.

Two facts follow, and most JWT bugs come from forgetting one of them:

1. **Anyone can read a JWT.** base64url is an encoding, not encryption. Paste one into any decoder and the claims are there. Never put anything secret in a payload.
2. **Nobody can change one.** Edit a single character of the payload and the signature no longer matches. That's why the server can trust `role: "organiser"` without asking the database.

### Verifying: the order is the security

1. Three parts, or reject it.
2. **The server picks the algorithm, not the token.** Some libraries once trusted the header, so an attacker sent `"alg": "none"` with no signature and was let in. Accept only `HS256`.
3. Recompute the signature and compare it with `timingSafeEqual` (Part 1 explains why).
4. Only then read the claims, and check `exp`.

### Access tokens and refresh tokens

A JWT is checked without the database, which makes it fast. The catch: **you can't take one back.** If it's valid, it works until it expires, even after the user logs out or is banned. So you use two tokens:

| | Access token | Refresh token |
|---|---|---|
| What it is | A JWT | A random string, like Part 1's session token |
| Lives | **15 minutes** | 30 days |
| Sent with | every API call, as `Authorization: Bearer <token>` | only `POST /auth/refresh`, in a cookie |
| Stored by the browser | in memory (a variable), never `localStorage` | an `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/auth` cookie |
| Stored by the server | nothing | its **hash**, like a session |
| Can be taken back | no, it just expires | yes: delete or revoke it |

When the access token runs out, the API answers `401`. The client calls `POST /auth/refresh`; the cookie goes along on its own, and a new access token comes back.

### Rotation and reuse detection

Every refresh **rotates** the refresh token: the old one is used up and a new one is issued in the same *family* (one family per login, so per device). Now imagine a thief copied the cookie:

- The real user refreshes first: their old token is used up. The thief then tries the copy: a used-up token came back, which can only mean two people hold it. **Revoke the whole family.** Both must log in again, and only the real one can.
- The thief refreshes first: same story the other way round, the moment the real user refreshes.

Other families, like the same user's laptop, keep working.

### Many tabs, one refresh

Access tokens expire while people use the app, often in five requests at once. If each request refreshed on its own, the first would rotate the token and the other four would send the used-up one: **reuse detected, user logged out**, for doing nothing wrong. This bug is common in real products.

The fix is a **single flight**: the first request to get a 401 starts the refresh, everyone else waits for that same promise, and then they all replay with the new token. One more case: a slow request might come back with a 401 *after* someone else already refreshed. It shouldn't refresh again; it just replays with the token that's now current.

### 401 or 403?

- **401 Unauthorized** really means *unauthenticated*: "I don't know who you are." No token, a broken token, an expired one. Send a `WWW-Authenticate: Bearer` header saying so; with `error="invalid_token"` the client knows a refresh might help.
- **403 Forbidden**: "I know who you are, and you can't do this." A fan creating an event. Refreshing won't help.

### Sessions or JWTs?

| | Sessions (Part 1) | JWT + refresh (Part 2) |
|---|---|---|
| Check per request | a database lookup | a signature check, no database |
| Log out / ban someone | instant: delete the row | only when the access token expires (15 min) |
| Works across many services | they all need the session store | any service with the key can check it |
| Mobile apps, other domains | cookies are awkward | a header works anywhere |
| Ways to get it wrong | few | many: `alg`, storage, refresh races, revocation |

For one website talking to its own API, **sessions are simpler and safer**: choose them unless you have a reason. Use tokens for mobile apps, for an API that other services call, or across several back ends.

## Steps

1. `starter/passwords.ts`: `hashPassword`, `verifyPassword`, `passwordProblem`.
2. `starter/sessions.ts`: `createSession`, `findSession`, `endSession`, `endAllSessions`.
3. `starter/app.ts`: sign-up is written. Add the cookie settings in `startSession`, the `currentUser` middleware, then login, logout and `/me`.
4. Run the tests:

   ```bash
   npm test -- day-061
   ```

5. Try it with `curl` (the commands are in `main.ts`). Open `starter/auth.db` with any SQLite viewer and look at what's actually stored.
6. **Part 2.** In `starter/`, in this order:
   - `jwt.ts`: `signJwt`, `decodeJwt`, `verifyJwt`. When it signs, paste a token into a JWT decoder and read the claims back.
   - `refresh-tokens.ts`: `issue`, `rotate`, `revoke`.
   - `client.ts`: `singleFlight`, then `request` in `createAuthClient`.
   - `token-app.ts`: login and logout are written. Add `accessTokenFor`, the `requireToken` middleware and `/auth/refresh`.
7. Run the Part 2 tests on their own:

   ```bash
   npm test -- day-061-signup-and-login/tokens
   ```

## When you're stuck

- **Every login fails after a restart** — you hashed with a new salt when checking. Read the salt *from the stored hash* and use that.
- **`timingSafeEqual` throws `Input buffers must have the same byte length`** — check the lengths first, and return `false` if they differ.
- **The browser never sends the cookie back** — on `http://localhost` a `Secure` cookie isn't sent. `main.ts` turns `Secure` off outside production for exactly this.
- **Logging out doesn't log you out** — clearing the cookie isn't enough; delete the session row too. Anyone who copied the cookie could still use it otherwise.
- **Part 2: a token you just signed fails `verifyJwt` with `bad-signature`.** Sign exactly `header + "." + payload`, the two base64url strings, not the objects or the JSON.
- **Part 2: tokens expire an hour late, or straight away.** `exp` is in seconds and `Date.getTime()` is in milliseconds. Divide by 1000.
- **Part 2: the "five requests at once" test calls refresh five times.** Every request must call the *same* `singleFlight` function, made once in `createAuthClient`, not a new one per request.
- **Part 2: after a reuse, the real user's new token still works.** Revoke the *family*, not just the token that came back.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
