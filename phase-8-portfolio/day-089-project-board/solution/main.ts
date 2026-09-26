import { LABELS, emptyBoard, load, moveBy, reduce, visibleCards, columnOf, type Action, type Board, type Label } from "./board.ts";

// The page. The board's rules are in board.ts; this draws the board and turns drags and keys into actions.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const KEY = "project-board";

function sample(): Board {
  let board = emptyBoard();
  const add = (columnId: string, title: string, labels: Label[]) => (board = reduce(board, { type: "add", columnId, card: { id: crypto.randomUUID(), title, labels } }).board);
  add("todo", "Write the event page copy", ["content"]);
  add("todo", "M-Pesa callback retries", ["backend"]);
  add("todo", "Dark mode for the ticket page", ["design"]);
  add("doing", "Seat map loads slowly on 3G", ["bug", "urgent"]);
  add("doing", "Check-in screen for organisers", ["design", "backend"]);
  add("done", "Sign up and log in", ["backend"]);
  add("done", "Logo and colours", ["design"]);
  return board;
}

let board: Board = (() => {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? load(JSON.parse(saved)) : sample();
  } catch {
    return sample();
  }
})();
let search = "";
let filter: Label | null = null;
let grabbed: { cardId: string; from: { columnId: string; index: number } } | null = null;
let editing: string | null = null;

const announce = (text: string) => ($("announce").textContent = text);
function toast(text: string): void {
  $("toast").textContent = text;
  $("toast").hidden = false;
  setTimeout(() => ($("toast").hidden = true), 3000);
}

function apply(action: Action): boolean {
  const result = reduce(board, action);
  if (result.error) {
    toast(result.error);
    announce(result.error);
    return false;
  }
  board = result.board;
  try {
    localStorage.setItem(KEY, JSON.stringify(board));
  } catch {
    /* the board lasts until the page closes */
  }
  return true;
}

function where(cardId: string): string {
  const column = columnOf(board, cardId)!;
  return `${column.title}, position ${column.cardIds.indexOf(cardId) + 1} of ${column.cardIds.length}`;
}

function render(focusCard?: string): void {
  $("board").replaceChildren(
    ...board.columns.map((column) => {
      const section = document.createElement("section");
      section.className = "column";
      section.setAttribute("aria-labelledby", `col-${column.id}`);
      if (column.limit !== null && column.cardIds.length >= column.limit) section.dataset.full = "";
      section.innerHTML = `<div class="column-head"><h2 id="col-${column.id}"></h2><span class="count"></span></div><ul class="cards"></ul><form class="add"><label class="visually-hidden" for="add-${column.id}"></label><input id="add-${column.id}" placeholder="+ Add a card" maxlength="120" autocomplete="off" /></form>`;
      section.querySelector("h2")!.textContent = column.title;
      section.querySelector(".count")!.textContent = column.limit === null ? String(column.cardIds.length) : `${column.cardIds.length}/${column.limit}`;
      section.querySelector("label")!.textContent = `Add a card to ${column.title}`;
      const list = section.querySelector("ul")!;
      for (const card of visibleCards(board, column.id, search, filter)) {
        const li = document.createElement("li");
        li.className = "card";
        li.tabIndex = 0;
        li.draggable = editing !== card.id;
        li.dataset.id = card.id;
        li.setAttribute("aria-grabbed", String(grabbed?.cardId === card.id));
        li.setAttribute("aria-label", `${card.title}${card.labels.length ? `, labels ${card.labels.join(", ")}` : ""}. ${where(card.id)}.`);
        if (editing === card.id) li.append(editor(card.id));
        else {
          li.innerHTML = `<p class="card-title"></p><div class="labels"></div><button type="button" class="edit" aria-label="Edit">✎</button>`;
          li.querySelector(".card-title")!.textContent = card.title;
          li.querySelector(".labels")!.append(
            ...card.labels.map((label) => Object.assign(document.createElement("span"), { className: "label", textContent: label, style: `--l: var(--${label})` })),
          );
          li.querySelector(".edit")!.addEventListener("click", (e) => ((e.stopPropagation(), (editing = card.id)), render()));
        }
        list.append(li);
      }
      // Drop anywhere in a column: the card lands before the card under the pointer, or at the end.
      list.addEventListener("dragover", (e) => ((e.preventDefault(), list.classList.add("over"))));
      list.addEventListener("dragleave", () => list.classList.remove("over"));
      list.addEventListener("drop", (e) => {
        e.preventDefault();
        list.classList.remove("over");
        const cardId = e.dataTransfer?.getData("text/plain");
        if (!cardId) return;
        const before = (e.target as HTMLElement).closest<HTMLElement>(".card");
        const ids = column.cardIds.filter((id) => id !== cardId);
        const index = before?.dataset.id && before.dataset.id !== cardId ? ids.indexOf(before.dataset.id) : ids.length;
        if (apply({ type: "move", cardId, toColumnId: column.id, toIndex: index })) announce(`Moved to ${where(cardId)}`);
        render(cardId);
      });
      section.querySelector("form")!.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = section.querySelector("input")!;
        if (apply({ type: "add", columnId: column.id, card: { id: crypto.randomUUID(), title: input.value, labels: [] } })) {
          render();
          ($(`add-${column.id}`) as HTMLInputElement).focus();
        }
      });
      return section;
    }),
  );
  if (focusCard) document.querySelector<HTMLElement>(`[data-id="${focusCard}"]`)?.focus();
}

function editor(cardId: string): HTMLElement {
  const card = board.cards[cardId];
  const form = document.createElement("form");
  form.className = "editor";
  form.innerHTML = `<label class="visually-hidden" for="edit-title">Title</label><input type="text" id="edit-title" maxlength="120" /><fieldset><legend class="visually-hidden">Labels</legend></fieldset><div class="editor-actions"><button type="submit" class="save">Save</button><button type="button" class="cancel">Cancel</button><button type="button" class="delete">Delete</button></div>`;
  const title = form.querySelector<HTMLInputElement>("#edit-title")!;
  title.value = card.title;
  form.querySelector("fieldset")!.append(
    ...LABELS.map((label) => {
      const l = document.createElement("label");
      l.innerHTML = `<input type="checkbox" value="${label}" ${card.labels.includes(label) ? "checked" : ""} /> ${label}`;
      return l;
    }),
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const labels = [...form.querySelectorAll<HTMLInputElement>("input[type=checkbox]:checked")].map((i) => i.value as Label);
    if (apply({ type: "edit", cardId, title: title.value, labels })) ((editing = null), render(cardId));
  });
  form.querySelector(".cancel")!.addEventListener("click", () => ((editing = null), render(cardId)));
  form.querySelector(".delete")!.addEventListener("click", () => {
    apply({ type: "delete", cardId });
    editing = null;
    render();
    announce(`Deleted ${card.title}`);
  });
  queueMicrotask(() => title.focus());
  form.addEventListener("keydown", (e) => e.stopPropagation()); // typing here isn't moving cards
  return form;
}

// Keyboard moves: Space picks up and drops, arrows move while it's held, Escape puts it back.
$("board").addEventListener("keydown", (e) => {
  const cardEl = (e.target as HTMLElement).closest<HTMLElement>(".card");
  if (!cardEl || (e.target as HTMLElement).tagName === "INPUT") return;
  const cardId = cardEl.dataset.id!;
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    if (grabbed?.cardId === cardId) {
      grabbed = null;
      announce(`Dropped. ${where(cardId)}.`);
    } else {
      const column = columnOf(board, cardId)!;
      grabbed = { cardId, from: { columnId: column.id, index: column.cardIds.indexOf(cardId) } };
      announce(`Picked up ${board.cards[cardId].title}. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
    }
    return render(cardId);
  }
  if (e.key === "Escape" && grabbed) {
    apply({ type: "move", cardId: grabbed.cardId, toColumnId: grabbed.from.columnId, toIndex: grabbed.from.index });
    grabbed = null;
    announce("Cancelled. The card is back where it was.");
    return render(cardId);
  }
  const direction = ({ ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" } as const)[e.key as "ArrowUp"];
  if (direction && grabbed?.cardId === cardId) {
    e.preventDefault();
    const action = moveBy(board, cardId, direction);
    if (action && apply(action)) announce(where(cardId));
    render(cardId);
  }
});

$("board").addEventListener("dragstart", (e) => {
  const cardEl = (e.target as HTMLElement).closest<HTMLElement>(".card");
  if (!cardEl) return;
  e.dataTransfer?.setData("text/plain", cardEl.dataset.id!);
  cardEl.classList.add("dragging");
});
$("board").addEventListener("dragend", (e) => (e.target as HTMLElement).classList?.remove("dragging"));

$<HTMLInputElement>("search").addEventListener("input", (e) => ((search = (e.target as HTMLInputElement).value), render()));
$("filters").append(
  ...LABELS.map((label) => {
    const button = Object.assign(document.createElement("button"), { type: "button", textContent: label });
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      filter = filter === label ? null : label;
      $("filters").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.textContent === filter)));
      render();
    });
    return button;
  }),
);

render();
