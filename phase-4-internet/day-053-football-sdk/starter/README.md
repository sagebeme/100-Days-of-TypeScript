# @your-name/ligi

A typed client for the Ligi football API: league tables, teams and fixtures for Kenyan football.

```ts
import { createLigiClient, LigiError } from "@your-name/ligi";

const ligi = createLigiClient({ apiKey: process.env.LIGI_API_KEY! });

const table = await ligi.standings("kpl");
console.log(table.table[0].team.name); // the league leaders

try {
  await ligi.team("no-such-team");
} catch (error) {
  if (error instanceof LigiError && error.status === 404) console.log("No such team");
}
```

- Every response is checked at runtime, so a change on the API side is a clear `LigiError`, not a silent `undefined`.
- `fixtures()` returns `kickoff` as a `Date`.
- Pass your own `fetch` to add retries or logging.

MIT licence.
