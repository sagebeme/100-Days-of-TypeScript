export type Matchup = [string, string];

export function createMatchups(players: string[], random: () => number = Math.random): Matchup[] {
  // TODO: copy players into `shuffled` with [...players]
  // TODO: Fisher-Yates: for i from shuffled.length - 1 down to 1,
  // TODO:   pick j = Math.floor(random() * (i + 1)) and swap shuffled[i] with shuffled[j]
  // TODO: walk through shuffled two at a time, pushing [shuffled[i], shuffled[i + 1]] into matchups
  // TODO: return matchups
  throw new Error("not implemented yet");
}
