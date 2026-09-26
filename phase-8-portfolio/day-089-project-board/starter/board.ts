// A kanban board, as data and a reducer. The tests are the spec.
export const LABELS = ["design", "backend", "bug", "content", "urgent"] as const;
export type Label = (typeof LABELS)[number];

export interface Card {
  id: string;
  title: string;
  labels: Label[];
}

export interface Column {
  id: string;
  title: string;
  limit: number | null;
  cardIds: string[];
}

export interface Board {
  version: 2;
  columns: Column[];
  cards: Record<string, Card>;
}

export type Action =
  | { type: "add"; columnId: string; card: Card }
  | { type: "move"; cardId: string; toColumnId: string; toIndex: number }
  | { type: "edit"; cardId: string; title?: string; labels?: Label[] }
  | { type: "delete"; cardId: string }
  | { type: "setLimit"; columnId: string; limit: number | null };

export type Result = { board: Board; error: null } | { board: Board; error: string };

export function emptyBoard(): Board {
  return {
    version: 2,
    columns: [
      { id: "todo", title: "To do", limit: null, cardIds: [] },
      { id: "doing", title: "Doing", limit: 3, cardIds: [] },
      { id: "done", title: "Done", limit: null, cardIds: [] },
    ],
    cards: {},
  };
}

export function columnOf(board: Board, cardId: string): Column | undefined {
  return board.columns.find((c) => c.cardIds.includes(cardId));
}

export function reduce(board: Board, action: Action): Result {
  throw new Error(`TODO: reduce(${board.columns.length} columns, ${action.type})`);
}

export function moveBy(board: Board, cardId: string, direction: "up" | "down" | "left" | "right"): Action | null {
  throw new Error(`TODO: moveBy(${board.columns.length}, ${cardId}, ${direction})`);
}

export function visibleCards(board: Board, columnId: string, search: string, label: Label | null): Card[] {
  throw new Error(`TODO: visibleCards(${board.columns.length}, ${columnId}, ${search}, ${label})`);
}

// Boards saved by the first version looked like { columns: [{ id, title, tasks: [{ id, text }] }] }.
export function load(saved: unknown): Board {
  throw new Error(`TODO: load(${typeof saved})`);
}
