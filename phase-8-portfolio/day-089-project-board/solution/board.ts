// A kanban board, as data and a reducer: every change is an action, and the rules live in one place.

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
  limit: number | null; // the most cards it may hold (work in progress), or no limit
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

// The result of an action: the new board, or the board unchanged and the reason.
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

const fail = (board: Board, error: string): Result => ({ board, error });
const ok = (board: Board): Result => ({ board, error: null });
const withColumns = (board: Board, update: (c: Column) => Column): Board => ({ ...board, columns: board.columns.map(update) });

export function reduce(board: Board, action: Action): Result {
  switch (action.type) {
    case "add": {
      const title = action.card.title.trim();
      if (!title) return fail(board, "Give the card a title");
      if (board.cards[action.card.id]) return fail(board, "That card is already on the board");
      const column = board.columns.find((c) => c.id === action.columnId);
      if (!column) return fail(board, "There's no such column");
      if (column.limit !== null && column.cardIds.length >= column.limit) return fail(board, `${column.title} is full (${column.limit} at most)`);
      return ok({
        ...withColumns(board, (c) => (c.id === column.id ? { ...c, cardIds: [...c.cardIds, action.card.id] } : c)),
        cards: { ...board.cards, [action.card.id]: { ...action.card, title } },
      });
    }
    case "move": {
      const from = columnOf(board, action.cardId);
      const to = board.columns.find((c) => c.id === action.toColumnId);
      if (!from || !to) return fail(board, "There's no such card or column");
      // A full column still lets its own cards be reordered; only cards coming in are refused.
      if (from.id !== to.id && to.limit !== null && to.cardIds.length >= to.limit) return fail(board, `${to.title} is full (${to.limit} at most). Finish something first.`);
      const remaining = to.cardIds.filter((id) => id !== action.cardId);
      const index = Math.max(0, Math.min(action.toIndex, remaining.length));
      const placed = [...remaining.slice(0, index), action.cardId, ...remaining.slice(index)];
      return ok(withColumns(board, (c) => (c.id === to.id ? { ...c, cardIds: placed } : c.id === from.id ? { ...c, cardIds: c.cardIds.filter((id) => id !== action.cardId) } : c)));
    }
    case "edit": {
      const card = board.cards[action.cardId];
      if (!card) return fail(board, "There's no such card");
      const title = action.title === undefined ? card.title : action.title.trim();
      if (!title) return fail(board, "A card needs a title");
      const labels = action.labels === undefined ? card.labels : [...new Set(action.labels)];
      return ok({ ...board, cards: { ...board.cards, [card.id]: { ...card, title, labels } } });
    }
    case "delete": {
      if (!board.cards[action.cardId]) return fail(board, "There's no such card");
      const cards = { ...board.cards };
      delete cards[action.cardId];
      return ok({ ...withColumns(board, (c) => ({ ...c, cardIds: c.cardIds.filter((id) => id !== action.cardId) })), cards });
    }
    case "setLimit": {
      const column = board.columns.find((c) => c.id === action.columnId);
      if (!column) return fail(board, "There's no such column");
      if (action.limit !== null && (!Number.isInteger(action.limit) || action.limit < 1)) return fail(board, "A limit is a whole number, 1 or more");
      if (action.limit !== null && column.cardIds.length > action.limit) return fail(board, `${column.title} already has ${column.cardIds.length} cards`);
      return ok(withColumns(board, (c) => (c.id === column.id ? { ...c, limit: action.limit } : c)));
    }
  }
}

// The keyboard way to move a card: up and down within its column, left and right between columns
// (landing at the same position, or the end).
export function moveBy(board: Board, cardId: string, direction: "up" | "down" | "left" | "right"): Action | null {
  const from = columnOf(board, cardId);
  if (!from) return null;
  const index = from.cardIds.indexOf(cardId);
  const col = board.columns.indexOf(from);
  if (direction === "up") return index > 0 ? { type: "move", cardId, toColumnId: from.id, toIndex: index - 1 } : null;
  if (direction === "down") return index < from.cardIds.length - 1 ? { type: "move", cardId, toColumnId: from.id, toIndex: index + 1 } : null;
  const target = board.columns[col + (direction === "left" ? -1 : 1)];
  return target ? { type: "move", cardId, toColumnId: target.id, toIndex: index } : null;
}

// Cards to show: matching every word of the search (in the title or a label), and the label filter.
export function visibleCards(board: Board, columnId: string, search: string, label: Label | null): Card[] {
  const column = board.columns.find((c) => c.id === columnId);
  if (!column) return [];
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  return column.cardIds
    .map((id) => board.cards[id])
    .filter((card) => (!label || card.labels.includes(label)) && words.every((w) => `${card.title} ${card.labels.join(" ")}`.toLowerCase().includes(w)));
}

// Boards saved by the first version had no limits and no labels, and kept tasks as a list per column.
// Old saved boards are upgraded, not thrown away: people's work matters more than tidy code.
interface BoardV1 {
  version?: 1;
  columns: { id: string; title: string; tasks: { id: string; text: string }[] }[];
}

export function load(saved: unknown): Board {
  if (!saved || typeof saved !== "object") return emptyBoard();
  const data = saved as { version?: number; columns?: unknown; cards?: unknown };
  if (data.version === 2 && Array.isArray(data.columns) && data.cards && typeof data.cards === "object") return saved as Board;
  const isV1Column = (c: unknown): c is BoardV1["columns"][number] => typeof c === "object" && c !== null && Array.isArray((c as { tasks?: unknown }).tasks);
  if (Array.isArray(data.columns) && data.columns.every(isV1Column)) {
    const cards: Record<string, Card> = {};
    const columns = data.columns.map((c) => {
      for (const task of c.tasks) cards[task.id] = { id: task.id, title: task.text, labels: [] };
      return { id: c.id, title: c.title, limit: null, cardIds: c.tasks.map((t) => t.id) };
    });
    return { version: 2, columns, cards };
  }
  return emptyBoard();
}
