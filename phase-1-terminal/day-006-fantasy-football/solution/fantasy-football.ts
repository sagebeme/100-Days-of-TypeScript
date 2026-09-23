export function calculateFantasyPoints(
  players: { goals: number; assists: number; cleanSheet: boolean }[]
): number {
  let total = 0;
  for (const player of players) {
    total += player.goals * 4;
    total += player.assists * 3;
    if (player.cleanSheet) {
      total += 4;
    }
  }
  return total;
}
