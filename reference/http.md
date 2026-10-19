# HTTP: methods and status codes

A reference to keep open from Day 43 onwards. Every example uses the ticketing platform you build in Phase 5: events, tickets, fans and organisers.

## A request and a response

```
POST /events/42/tickets HTTP/1.1        <- method, path
Authorization: Bearer eyJhbGci...        <- headers
Content-Type: application/json

{ "quantity": 2 }                        <- body

HTTP/1.1 201 Created                     <- status code
Location: /tickets/9001
Content-Type: application/json

{ "id": 9001, "quantity": 2 }
```

The **method** says what you want done, the **path** says to what, and the **status code** says how it went.

## Methods

Two words decide how a method may be used:

- **Safe**: it doesn't change anything on the server. Browsers, caches and crawlers fetch safe requests freely, so a `GET` must never delete or buy anything.
- **Idempotent**: sending it twice has the same effect as sending it once. This is what makes a retry over bad Wi-Fi harmless (Day 48).

| Method | Use it to | Safe | Idempotent | Body | Usual success |
|---|---|---|---|---|---|
| `GET` | read something | yes | yes | no | `200 OK` |
| `HEAD` | `GET` without the body: does it exist, how big is it? | yes | yes | no | `200 OK` |
| `OPTIONS` | ask what's allowed; browsers send it before cross-site requests (CORS) | yes | yes | no | `204 No Content` |
| `POST` | create something, or run an action | no | **no** | yes | `201 Created` + `Location`, or `200 OK` |
| `PUT` | replace something whole, at a path you know | no | yes | yes | `200 OK`, or `201` if it was created |
| `PATCH` | change some fields of something | no | not guaranteed | yes | `200 OK` |
| `DELETE` | remove something | no | yes | usually no | `204 No Content` |

On the ticketing API:

```
GET    /events              the list
GET    /events/42           one event
POST   /events              create one          -> 201, Location: /events/43
PUT    /events/42           replace it whole (send every field)
PATCH  /events/42           { "price": 1500 }   change just the price
DELETE /events/42           -> 204
POST   /events/42/tickets   buy tickets: an action, so POST
```

### PUT or PATCH?

- `PUT` sends the **whole** thing. A field you leave out is gone. Sending the same `PUT` twice leaves the same result: idempotent.
- `PATCH` sends **only what changes**. `{ "price": 1500 }` touches the price and nothing else. `{ "seatsLeft": { "decrement": 1 } }` is a `PATCH` that is *not* idempotent: twice means two seats.

Most APIs use `PATCH` for edit forms, because the form rarely has every field.

### Why `POST` twice is dangerous, and the fix

"Buy 2 tickets" sent twice buys 4. A phone on a matatu sends it, the connection drops before the answer arrives, the app retries: double charge. The fix is an **idempotency key**: the client makes up a random ID per purchase and sends it as an `Idempotency-Key` header. The server remembers keys it has seen and, for a repeat, returns the first answer instead of buying again. Payment APIs work this way. On Day 48 your client sends one.

`DELETE` twice is fine: the second one finds nothing to delete. It may answer `404`, but the *state* is the same, which is what idempotent means.

## Status codes

The first digit is the class. A client that doesn't know a code treats it like the `x00` of its class.

| Class | Means | Whose move |
|---|---|---|
| `1xx` | informational: "carry on" | nobody's, yet |
| `2xx` | it worked | done |
| `3xx` | look elsewhere | the client follows |
| `4xx` | **your** request is wrong | the client must change something |
| `5xx` | **the server** failed | not the client's fault; retrying may help |

### 1xx: informational

You'll rarely handle these yourself.

| Code | When you see it |
|---|---|
| `100 Continue` | The client asked "may I send this big upload?" first; the server says go ahead |
| `101 Switching Protocols` | The connection becomes a WebSocket: the watch-party chat on Day 88 |
| `103 Early Hints` | "Start fetching this CSS while I build the page" |

### 2xx: success

| Code | When your API returns it |
|---|---|
| `200 OK` | Here it is. `GET /events/42`, or a `PATCH` that returns the updated event |
| `201 Created` | I made it. `POST /events`, with a `Location: /events/43` header |
| `202 Accepted` | Got it, I'll do it later. A bulk SMS to every ticket holder, queued |
| `204 No Content` | Done, nothing to show. `DELETE /events/42`, `POST /logout` |
| `206 Partial Content` | Here's the slice you asked for: video and big downloads, with `Range` |

### 3xx: redirection

| Code | When you see it |
|---|---|
| `301 Moved Permanently` | It lives at a new address for good, and browsers remember it forever. That's why your link shortener (Day 87) uses `302`: with a `301`, repeat clicks never reach you to be counted |
| `302 Found` | Temporarily elsewhere. After a form login, "go to /dashboard" |
| `303 See Other` | After a `POST`, go and `GET` this page instead, so refreshing doesn't buy twice |
| `304 Not Modified` | You already have the latest copy (your `If-None-Match` ETag matched), so no body is sent. Saves data on slow connections |
| `307` / `308` | Like `302` / `301`, but the method and body must stay the same: a redirected `POST` stays a `POST` |

### 4xx: the client's mistake

| Code | When your API returns it |
|---|---|
| `400 Bad Request` | The request can't be read: broken JSON, a missing field |
| `401 Unauthorized` | **Who are you?** No token or session, or it expired. Logging in or refreshing can fix it. Send `WWW-Authenticate` (Day 61) |
| `403 Forbidden` | **I know who you are, and no.** A fan creating an event (Day 62) |
| `404 Not Found` | Nothing there. Also used instead of `403` when even admitting it exists would leak something: another user's ticket |
| `405 Method Not Allowed` | The path exists but not for this method: `DELETE /health`. Include an `Allow` header (Day 55) |
| `406 Not Acceptable` | You asked (in `Accept`) for a format I can't produce |
| `408 Request Timeout` | You took too long to send the request |
| `409 Conflict` | It clashes with what's there: that email already has an account; the seat was just sold |
| `410 Gone` | It existed and was removed for good: a cancelled event's page |
| `412 Precondition Failed` | Someone else changed it since you read it (your `If-Match` ETag is stale), so your edit would overwrite theirs |
| `413 Content Too Large` | The body is too big: a 40 MB poster upload |
| `415 Unsupported Media Type` | I only take JSON, and you sent a form |
| `422 Unprocessable Content` | The JSON is fine but the values aren't: a password too short, a date in the past (Day 58) |
| `429 Too Many Requests` | Slow down. Send `Retry-After`. Stops password guessing and ticket bots (Day 64) |

**400 or 422?** `400` when you can't even read the request, `422` when you read it and the values break a rule. Many APIs use `400` for both; pick one and stay consistent.

**401 or 403?** Will logging in (again) fix it? Then `401`. If not, `403`.

### 5xx: the server's mistake

| Code | When you see it |
|---|---|
| `500 Internal Server Error` | A bug. Log the details; tell the client nothing about your code |
| `501 Not Implemented` | The server doesn't support that method at all |
| `502 Bad Gateway` | A server in front (a proxy, a load balancer) got a bad answer from yours: your app crashed |
| `503 Service Unavailable` | Down or overloaded for now. Send `Retry-After`. Ticket-drop day at 10:00 |
| `504 Gateway Timeout` | The proxy gave up waiting for your app: a slow query, or M-Pesa taking its time |

## Which ones are safe to retry?

| Response | Retry? |
|---|---|
| network error, `502`, `503`, `504` | **yes**, with a growing wait (1 s, 2 s, 4 s...) and only for idempotent requests, or a `POST` with an idempotency key |
| `429` | yes, after `Retry-After` |
| `401` with `invalid_token` | refresh the token once, then replay (Day 61 Part 2) |
| `500` | maybe once; it's probably a bug that will happen again |
| any other `4xx` | **no**: the same request gets the same answer. Fix the request |

## Where the course uses them

| Day | What you meet |
|---|---|
| 43–45 | calling APIs, checking `response.ok`, `401` and `429` from real services |
| 48 | timeouts, retries and idempotency keys over bad Wi-Fi |
| 55 | your own server: `200`, `201`, `400`, `404`, `405`, `413`, `415`, `500` |
| 56–58 | routes per method, validation and `422` |
| 61 | sessions, then JWTs: `401` with `WWW-Authenticate` |
| 62 | roles: `401`, `403` or `404`? |
| 64 | rate limits and `429` |
| 87 | redirects: `302`, and why not `301` |
| 88 | WebSockets: `101` |
