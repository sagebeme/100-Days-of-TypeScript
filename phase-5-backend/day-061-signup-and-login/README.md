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

## Steps

1. `starter/passwords.ts`: `hashPassword`, `verifyPassword`, `passwordProblem`.
2. `starter/sessions.ts`: `createSession`, `findSession`, `endSession`, `endAllSessions`.
3. `starter/app.ts`: sign-up is written. Add the cookie settings in `startSession`, the `currentUser` middleware, then login, logout and `/me`.
4. Run the tests:

   ```bash
   npm test -- day-061
   ```

5. Try it with `curl` (the commands are in `main.ts`). Open `starter/auth.db` with any SQLite viewer and look at what's actually stored.

## When you're stuck

- **Every login fails after a restart** — you hashed with a new salt when checking. Read the salt *from the stored hash* and use that.
- **`timingSafeEqual` throws `Input buffers must have the same byte length`** — check the lengths first, and return `false` if they differ.
- **The browser never sends the cookie back** — on `http://localhost` a `Secure` cookie isn't sent. `main.ts` turns `Secure` off outside production for exactly this.
- **Logging out doesn't log you out** — clearing the cookie isn't enough; delete the session row too. Anyone who copied the cookie could still use it otherwise.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
