export interface Card {
  id: string;
  sw: string;
  en: string;
}

export interface Progress {
  box: number; // 1, 2 or 3
  due: string; // "2026-10-02"
}

export type ProgressMap = Record<string, Progress>;

// Right answers move a card up a box. Box 1 comes back in 1 day, box 2 in 3, box 3 in 7.
export const REVIEW_AFTER_DAYS = [1, 3, 7];
export const TOP_BOX = REVIEW_AFTER_DAYS.length;

export function addDays(day: string, days: number): string {
  // TODO: "2026-10-01" + 3 -> "2026-10-04", in UTC
  throw new Error("not implemented yet");
}

export function review(progress: ProgressMap, cardId: string, correct: boolean, today: string): ProgressMap {
  // TODO: right -> one box up (new cards go to box 1, never above TOP_BOX), due in REVIEW_AFTER_DAYS[box - 1] days
  // TODO: wrong -> box 1, due today
  // TODO: return a NEW map; don't change `progress`
  throw new Error("not implemented yet");
}

export function dueCards(cards: Card[], progress: ProgressMap, today: string): Card[] {
  // TODO: due cards (due <= today), lowest box first, then new cards (no progress yet)
  throw new Error("not implemented yet");
}

export function learnedCount(progress: ProgressMap): number {
  // TODO: how many cards are in TOP_BOX
  throw new Error("not implemented yet");
}

export function loadProgress(storage: Pick<Storage, "getItem">, key: string): ProgressMap {
  // TODO: read and JSON.parse, inside try/catch
  // TODO: missing / broken / not an object -> {}
  // TODO: keep only entries with a whole-number box from 1 to TOP_BOX and a string due
  throw new Error("not implemented yet");
}

export function saveProgress(storage: Pick<Storage, "setItem">, key: string, progress: ProgressMap): boolean {
  // TODO: setItem(key, JSON.stringify(progress)) and return true; if it throws, return false
  throw new Error("not implemented yet");
}
