# Day 57: Best Street Food Near You — a REST CRUD API

Watch the video: *(not recorded yet)*

## The brief

You're in town, it's lunchtime, and you have KES 100. Where's the nearest smokie pasua? Build the API behind a street-food finder: list vendors near you, filter by dish and price, add new spots, fix their details, remove closed ones, and rate the ones you tried.

```
$ curl "localhost:3057/vendors?near=-1.2833,36.8167&maxPrice=100&limit=2"
{
  "data": [
    { "id": "kenyatta-ave-mutura", "dish": "mutura", "priceKes": 100, "distanceKm": 0.5, ... },
    { "id": "mama-njeri-smokies", "dish": "smokie pasua", "priceKes": 50, "distanceKm": 0.7, ... }
  ],
  "total": 4, "limit": 2, "offset": 0,
  "next": "/vendors?near=-1.2833%2C36.8167&maxPrice=100&limit=2&offset=2"
}
```

The vendors are made up, at real places around Nairobi.

## What you'll use

- **CRUD, the REST way**: Create, Read, Update, Delete, each with the HTTP method and status that means it:

  | Request | Does | Answers |
  | --- | --- | --- |
  | `GET /vendors` | list, filter, sort, page | `200` with a page |
  | `GET /vendors/:id` | one vendor | `200`, or `404` |
  | `POST /vendors` | create | `201` + `Location` header |
  | `PUT /vendors/:id` | replace **every** field | `200` |
  | `PATCH /vendors/:id` | change **some** fields | `200` |
  | `DELETE /vendors/:id` | remove | `204`, with no body |
  | `POST /vendors/:id/reviews` | add a rating | `201` |

- **Server-owned fields**: clients never set `id`, `rating` or `reviewCount`. The server works them out, and a `PATCH` that tries is refused.
- **Pagination**: `limit` and `offset`, a hard maximum so nobody can ask for a million rows, `total` so apps can show "4 results", and a ready-made `next` link.
- **Geography**: the haversine formula for the distance between two points on the Earth, then sorting by it.
- **The repository pattern**: `VendorRepository` is an interface. Routes only talk to it. Today it's a `Map` in memory; on Day 59 the same routes will run on a real database without changing a line.

## Steps

1. `starter/vendors.ts`: `distanceKm`, then `createMemoryRepository`. `list` is the biggest part: filter, add distances, sort, then page.
2. `starter/app.ts`: the checks (`fullInput`, `partialInput`, `query`) are written. Write the seven routes.
3. Run the tests:

   ```bash
   npm test -- day-057
   ```

4. Run it and try every verb:

   ```bash
   node phase-5-backend/day-057-street-food-api/starter/main.ts
   curl "localhost:3057/vendors?near=-1.2833,36.8167&sort=price"
   curl -X PATCH localhost:3057/vendors/cbd-githeri -H 'Content-Type: application/json' -d '{"priceKes":90}'
   curl -i -X DELETE localhost:3057/vendors/cbd-githeri
   ```

## Check yourself

1. What's the difference between `PUT /vendors/:id` and `PATCH /vendors/:id`? What happens to a field you leave out of each?
2. Why does `POST /vendors` answer `201` with a `Location` header, and `DELETE` answer `204` with no body?
3. A client sends `PATCH /vendors/cbd-githeri` with `{ "rating": 5 }`. What happens, and why?
4. Predict the output, roughly: `distanceKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })`

<details><summary>Answers</summary>

1. `PUT` replaces the whole vendor, so every field must be sent and nothing is kept from before. `PATCH` changes only the fields you send and keeps the rest.
2. `201 Created` says something new exists, and `Location` says where (`/vendors/<id>`), so the client doesn't have to guess. After a delete there's nothing to send back; `204 No Content` says it worked.
3. `400`, "rating can't be changed". `rating`, `reviewCount` and `id` are owned by the server: a rating comes from `POST /vendors/:id/reviews`, never from a client setting it.
4. About `111.19` km. One degree of latitude is roughly 111 km anywhere on Earth.

</details>

## When you're stuck

- **Distances are huge or tiny** — the trig functions need radians. Multiply degrees by π / 180 first.
- **`total` equals `limit`** — you counted after slicing. Count the matches first, then slice.
- **PUT with one field wipes the others** — that's what PUT means, so it demands every field. Use PATCH to change one.
- **`DELETE` returns `null` as its body** — use `c.body(null, 204)`. A 204 has no body at all.
- **Still stuck?** Read the files in `solution/`, then close them and write your own from memory.
