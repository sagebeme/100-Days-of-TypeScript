// Already written: a local stand-in for the (made-up) Ligi football API, with made-up numbers.
//   node phase-4-internet/day-053-football-sdk/starter/fake-ligi-api.ts
import { createServer } from "node:http";

export const PORT = 5353;
export const API_KEY = "ligi-practice-key";

const teams = {
  gor: { id: "gor", name: "Gor Mahia", short: "GOR", founded: 1968, stadium: "Nyayo National Stadium" },
  afc: { id: "afc", name: "AFC Leopards", short: "AFC", founded: 1964, stadium: "Nyayo National Stadium" },
  tus: { id: "tus", name: "Tusker", short: "TUS", founded: 1969, stadium: "Ruaraka Grounds" },
  hmb: { id: "hmb", name: "Kakamega Homeboyz", short: "HMB", founded: 2006, stadium: "Bukhungu Stadium" },
};
const ref = (id: keyof typeof teams) => ({ id, name: teams[id].name, short: teams[id].short });

const standings = {
  league: "kpl",
  season: "2026/27",
  updated: "2026-10-05T18:00:00Z",
  table: [
    { position: 1, team: ref("gor"), played: 6, won: 5, drawn: 1, lost: 0, goalsFor: 13, goalsAgainst: 3, points: 16, form: "WWDWW" },
    { position: 2, team: ref("tus"), played: 6, won: 4, drawn: 1, lost: 1, goalsFor: 10, goalsAgainst: 5, points: 13, form: "WLWWD" },
    { position: 3, team: ref("afc"), played: 6, won: 3, drawn: 2, lost: 1, goalsFor: 8, goalsAgainst: 6, points: 11, form: "DWWLD" },
    { position: 4, team: ref("hmb"), played: 6, won: 2, drawn: 1, lost: 3, goalsFor: 7, goalsAgainst: 9, points: 7, form: "LWLDW" },
  ],
};

const fixtures = [
  { id: "f1", kickoff: "2026-10-04T12:00:00Z", home: ref("gor"), away: ref("afc"), venue: "Nyayo National Stadium", status: "finished", score: { home: 2, away: 1 } },
  { id: "f2", kickoff: "2026-10-11T13:00:00Z", home: ref("tus"), away: ref("gor"), venue: "Ruaraka Grounds", status: "scheduled", score: null },
  { id: "f3", kickoff: "2026-10-18T13:00:00Z", home: ref("gor"), away: ref("hmb"), venue: "Nyayo National Stadium", status: "scheduled", score: null },
];

export const server = createServer((request, response) => {
  const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
    response.writeHead(status, { "Content-Type": "application/json", ...headers });
    response.end(JSON.stringify(body));
  };
  if (request.headers["x-api-key"] !== API_KEY) {
    return send(401, { error: { code: "unauthorized", message: "Missing or invalid API key" } });
  }
  const url = new URL(request.url ?? "/", "http://localhost");
  let match: RegExpExecArray | null;

  if (url.pathname === "/v1/leagues/kpl/standings") return send(200, standings);
  if ((match = /^\/v1\/teams\/([\w-]+)$/.exec(url.pathname))) {
    const team = teams[match[1] as keyof typeof teams];
    return team ? send(200, team) : send(404, { error: { code: "not_found", message: `No team called ${match[1]}` } });
  }
  if ((match = /^\/v1\/teams\/([\w-]+)\/fixtures$/.exec(url.pathname))) {
    const from = url.searchParams.get("from") ?? "0000";
    const to = url.searchParams.get("to") ?? "9999";
    const list = fixtures.filter(
      (f) => (f.home.id === match![1] || f.away.id === match![1]) && f.kickoff.slice(0, 10) >= from && f.kickoff.slice(0, 10) <= to,
    );
    return send(200, { fixtures: list });
  }
  send(404, { error: { code: "not_found", message: "No such endpoint" } });
});

if (import.meta.main) {
  server.listen(PORT, () => console.log(`Fake Ligi API on http://localhost:${PORT}/v1 (key: ${API_KEY})`));
}
