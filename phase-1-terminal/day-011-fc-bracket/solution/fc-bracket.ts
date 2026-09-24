export type Matchup = [string, string];

export function createMatchups(players: string[], random: () => number = Math.random): Matchup[] {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  const matchups: Matchup[] = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    matchups.push([shuffled[i], shuffled[i + 1]]);
  }
  return matchups;
}
