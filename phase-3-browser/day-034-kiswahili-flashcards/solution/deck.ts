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
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function review(progress: ProgressMap, cardId: string, correct: boolean, today: string): ProgressMap {
  if (!correct) {
    return { ...progress, [cardId]: { box: 1, due: today } };
  }
  const box = Math.min((progress[cardId]?.box ?? 0) + 1, TOP_BOX);
  return { ...progress, [cardId]: { box, due: addDays(today, REVIEW_AFTER_DAYS[box - 1]) } };
}

export function dueCards(cards: Card[], progress: ProgressMap, today: string): Card[] {
  const due = cards
    .filter((card) => progress[card.id] !== undefined && progress[card.id].due <= today)
    .sort((a, b) => progress[a.id].box - progress[b.id].box);
  const fresh = cards.filter((card) => progress[card.id] === undefined);
  return [...due, ...fresh];
}

export function learnedCount(progress: ProgressMap): number {
  return Object.values(progress).filter((entry) => entry.box === TOP_BOX).length;
}

function isProgress(value: unknown): value is Progress {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.box === "number" &&
    Number.isInteger(entry.box) &&
    entry.box >= 1 &&
    entry.box <= TOP_BOX &&
    typeof entry.due === "string"
  );
}

export function loadProgress(storage: Pick<Storage, "getItem">, key: string): ProgressMap {
  let data: unknown;
  try {
    data = JSON.parse(storage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return {};
  }
  const progress: ProgressMap = {};
  for (const [id, entry] of Object.entries(data)) {
    if (isProgress(entry)) {
      progress[id] = { box: entry.box, due: entry.due };
    }
  }
  return progress;
}

export function saveProgress(storage: Pick<Storage, "setItem">, key: string, progress: ProgressMap): boolean {
  try {
    storage.setItem(key, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
