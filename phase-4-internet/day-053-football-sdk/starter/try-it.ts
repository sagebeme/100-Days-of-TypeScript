// Already written: use your SDK the way someone who installed it would.
// Start the fake API first:  node phase-4-internet/day-053-football-sdk/starter/fake-ligi-api.ts
//   node phase-4-internet/day-053-football-sdk/starter/try-it.ts
import { createLigiClient, LigiError } from "./index.ts";

const ligi = createLigiClient({ apiKey: "ligi-practice-key", baseUrl: "http://localhost:5353/v1" });

const standings = await ligi.standings();
console.log(`KPL ${standings.season}\n`);
console.log(" #  Team                P   W   D   L   GD  Pts  Form");
for (const row of standings.table) {
  const gd = row.goalsFor - row.goalsAgainst;
  console.log(
    `${String(row.position).padStart(2)}  ${row.team.name.padEnd(18)}${[row.played, row.won, row.drawn, row.lost]
      .map((n) => String(n).padStart(4))
      .join("")}${(gd > 0 ? `+${gd}` : String(gd)).padStart(5)}${String(row.points).padStart(5)}  ${row.form}`,
  );
}

console.log("\nGor Mahia's October fixtures:");
for (const f of await ligi.fixtures("gor", { from: "2026-10-01", to: "2026-10-31" })) {
  const score = f.score ? ` ${f.score.home}-${f.score.away}` : "";
  console.log(`  ${f.kickoff.toDateString()}  ${f.home.short} vs ${f.away.short}${score}  (${f.status})`);
}

try {
  await ligi.team("simba");
} catch (error) {
  if (error instanceof LigiError) console.log(`\nLigiError ${error.status} ${error.code}: ${error.message}`);
}
