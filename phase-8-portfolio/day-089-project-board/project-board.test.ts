import { describe, it, expect } from "vitest";
import { emptyBoard, reduce, moveBy, visibleCards, load, columnOf, type Board, type Action } from "./starter/board.ts";

// Apply actions one after another; fail the test if any is refused.
function run(board: Board, ...actions: Action[]): Board {
  return actions.reduce((b, action) => {
    const result = reduce(b, action);
    if (result.error) throw new Error(result.error);
    return result.board;
  }, board);
}
const add = (columnId: string, id: string, title = id, labels: ("design" | "backend" | "bug" | "content" | "urgent")[] = []): Action => ({ type: "add", columnId, card: { id, title, labels } });
const ids = (board: Board, columnId: string) => board.columns.find((c) => c.id === columnId)!.cardIds;

describe("the board", () => {
  it("starts with To do, Doing (at most 3) and Done", () => {
    expect(emptyBoard().columns.map((c) => [c.title, c.limit])).toEqual([
      ["To do", null],
      ["Doing", 3],
      ["Done", null],
    ]);
  });

  it("adds cards to the end of a column, with a tidy title", () => {
    const b = run(emptyBoard(), add("todo", "a", "  Write the copy  "), add("todo", "b"));
    expect(ids(b, "todo")).toEqual(["a", "b"]);
    expect(b.cards.a.title).toBe("Write the copy");
  });

  it("refuses a card with no title, a repeated id, and a missing column", () => {
    expect(reduce(emptyBoard(), add("todo", "a", "   ")).error).toBe("Give the card a title");
    expect(reduce(run(emptyBoard(), add("todo", "a")), add("done", "a")).error).toMatch(/already/);
    expect(reduce(emptyBoard(), add("nope", "a")).error).toMatch(/no such column/);
  });

  it("never changes the board it was given", () => {
    const before = run(emptyBoard(), add("todo", "a"));
    const snapshot = JSON.stringify(before);
    reduce(before, { type: "move", cardId: "a", toColumnId: "done", toIndex: 0 });
    reduce(before, { type: "delete", cardId: "a" });
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe("moving cards", () => {
  const start = () => run(emptyBoard(), add("todo", "a"), add("todo", "b"), add("todo", "c"), add("done", "x"));

  it("moves between columns, to a position", () => {
    const b = run(start(), { type: "move", cardId: "b", toColumnId: "done", toIndex: 0 });
    expect([ids(b, "todo"), ids(b, "done")]).toEqual([["a", "c"], ["b", "x"]]);
    expect(columnOf(b, "b")?.id).toBe("done");
  });

  it("reorders within a column, and keeps positions in range", () => {
    expect(ids(run(start(), { type: "move", cardId: "a", toColumnId: "todo", toIndex: 2 }), "todo")).toEqual(["b", "c", "a"]);
    expect(ids(run(start(), { type: "move", cardId: "c", toColumnId: "todo", toIndex: -5 }), "todo")).toEqual(["c", "a", "b"]);
    expect(ids(run(start(), { type: "move", cardId: "a", toColumnId: "done", toIndex: 99 }), "done")).toEqual(["x", "a"]);
  });

  it("keeps work in progress under the limit, but lets a full column reorder itself", () => {
    const full = run(emptyBoard(), add("doing", "1"), add("doing", "2"), add("doing", "3"), add("todo", "t"));
    const refused = reduce(full, { type: "move", cardId: "t", toColumnId: "doing", toIndex: 0 });
    expect(refused.error).toBe("Doing is full (3 at most). Finish something first.");
    expect(refused.board).toBe(full);
    expect(reduce(full, add("doing", "4")).error).toMatch(/full/);
    expect(ids(run(full, { type: "move", cardId: "3", toColumnId: "doing", toIndex: 0 }), "doing")).toEqual(["3", "1", "2"]);
  });

  it("moves with the keyboard: up and down in a column, left and right between columns", () => {
    const b = start();
    expect(moveBy(b, "b", "up")).toEqual({ type: "move", cardId: "b", toColumnId: "todo", toIndex: 0 });
    expect(moveBy(b, "b", "down")).toEqual({ type: "move", cardId: "b", toColumnId: "todo", toIndex: 2 });
    expect(moveBy(b, "b", "right")).toEqual({ type: "move", cardId: "b", toColumnId: "doing", toIndex: 1 });
    expect(moveBy(b, "a", "up")).toBeNull();
    expect(moveBy(b, "c", "down")).toBeNull();
    expect(moveBy(b, "a", "left")).toBeNull();
    expect(moveBy(b, "missing", "up")).toBeNull();
  });
});

describe("editing and deleting", () => {
  it("edits the title and labels, without repeats", () => {
    const b = run(emptyBoard(), add("todo", "a", "Old"), { type: "edit", cardId: "a", title: " New ", labels: ["bug", "bug", "urgent"] });
    expect(b.cards.a).toEqual({ id: "a", title: "New", labels: ["bug", "urgent"] });
    expect(reduce(b, { type: "edit", cardId: "a", title: "  " }).error).toMatch(/title/);
  });

  it("deletes a card from its column and the board", () => {
    const b = run(emptyBoard(), add("todo", "a"), add("todo", "b"), { type: "delete", cardId: "a" });
    expect(ids(b, "todo")).toEqual(["b"]);
    expect(b.cards.a).toBeUndefined();
  });

  it("changes a column's limit, but not below what it holds", () => {
    const b = run(emptyBoard(), add("todo", "a"), add("todo", "b"));
    expect(run(b, { type: "setLimit", columnId: "todo", limit: 2 }).columns[0].limit).toBe(2);
    expect(reduce(b, { type: "setLimit", columnId: "todo", limit: 1 }).error).toMatch(/already has 2/);
    expect(reduce(b, { type: "setLimit", columnId: "todo", limit: 0 }).error).toMatch(/1 or more/);
  });
});

describe("finding cards", () => {
  it("matches every word of the search, in titles and labels, and the label filter", () => {
    const b = run(emptyBoard(), add("todo", "a", "M-Pesa callback retries", ["backend"]), add("todo", "b", "Dark mode for tickets", ["design"]), add("todo", "c", "Callback page design", ["design"]));
    expect(visibleCards(b, "todo", "callback", null).map((c) => c.id)).toEqual(["a", "c"]);
    expect(visibleCards(b, "todo", "callback design", null).map((c) => c.id)).toEqual(["c"]);
    expect(visibleCards(b, "todo", "", "design").map((c) => c.id)).toEqual(["b", "c"]);
    expect(visibleCards(b, "todo", "BACKEND", null).map((c) => c.id)).toEqual(["a"]);
  });
});

describe("saved boards", () => {
  it("loads today's boards as they are", () => {
    const b = run(emptyBoard(), add("todo", "a"));
    expect(load(JSON.parse(JSON.stringify(b)))).toEqual(b);
  });

  it("upgrades boards saved by the first version, keeping every task", () => {
    const old = { columns: [{ id: "todo", title: "To do", tasks: [{ id: "t1", text: "Buy chalk" }] }, { id: "done", title: "Done", tasks: [{ id: "t2", text: "Book venue" }] }] };
    expect(load(old)).toEqual({
      version: 2,
      columns: [
        { id: "todo", title: "To do", limit: null, cardIds: ["t1"] },
        { id: "done", title: "Done", limit: null, cardIds: ["t2"] },
      ],
      cards: { t1: { id: "t1", title: "Buy chalk", labels: [] }, t2: { id: "t2", title: "Book venue", labels: [] } },
    });
  });

  it("starts fresh from anything it can't read", () => {
    expect(load(null)).toEqual(emptyBoard());
    expect(load({ nonsense: true })).toEqual(emptyBoard());
  });
});
