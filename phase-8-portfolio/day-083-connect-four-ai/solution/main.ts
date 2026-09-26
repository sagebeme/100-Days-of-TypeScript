import { bestMove, COLS, drop, emptyBoard, isFull, landingRow, LEVELS, ROWS, winner, type Board, type Level, type Player } from "./game.ts";

// The page. The rules and the computer player are in game.ts.
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const boardEl = $("board");
const columnsEl = $("columns");
const statusEl = $("status");
const levelEl = $<HTMLSelectElement>("level");

let board: Board = emptyBoard();
let turn: Player = 1;
let over = false;
let last: [number, number] | null = null;
let hover: number | null = null;

const holes: HTMLElement[][] = Array.from({ length: ROWS }, () => []);
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const hole = document.createElement("div");
    hole.className = "hole";
    boardEl.append(hole);
    holes[r][c] = hole;
  }
}
const columnButtons = Array.from({ length: COLS }, (_, c) => {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", `Column ${c + 1}`);
  button.addEventListener("click", () => play(c));
  button.addEventListener("mouseenter", () => ((hover = c), render()));
  button.addEventListener("focus", () => ((hover = c), render()));
  button.addEventListener("mouseleave", () => ((hover = null), render()));
  button.addEventListener("keydown", (event) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step) {
      event.preventDefault();
      columnButtons[(c + step + COLS) % COLS].focus();
    }
  });
  columnsEl.append(button);
  return button;
});

function render(): void {
  const won = winner(board);
  const winning = new Set(won?.cells.map(([r, c]) => `${r},${c}`));
  const previewRow = hover !== null && !over && turn === 1 ? landingRow(board, hover) : -1;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const hole = holes[r][c];
      const cell = board[r][c];
      hole.classList.toggle("preview", previewRow === r && hover === c);
      const existing = hole.firstElementChild as HTMLElement | null;
      if (cell === 0) {
        existing?.remove();
        continue;
      }
      const disc = existing ?? hole.appendChild(document.createElement("i"));
      disc.className = "disc";
      disc.dataset.player = String(cell);
      if (last && last[0] === r && last[1] === c && !existing) {
        disc.classList.add("new");
        disc.style.setProperty("--drop", String(r + 1));
      }
      if (winning.has(`${r},${c}`)) disc.classList.add("win");
    }
  }
  columnButtons.forEach((button, c) => (button.disabled = over || turn !== 1 || board[0][c] !== 0));
}

// Ends the game if this move won or filled the board.
function afterMove(col: number): void {
  const won = winner(board);
  if (won) {
    over = true;
    statusEl.textContent = won.player === 1 ? "You win! Four in a row." : `The computer wins, with column ${col + 1}. Try again?`;
  } else if (isFull(board)) {
    over = true;
    statusEl.textContent = "A draw: the board is full.";
  }
  render();
}

function play(col: number): void {
  if (over || turn !== 1 || board[0][col] !== 0) return;
  last = [landingRow(board, col), col];
  board = drop(board, col, 1);
  afterMove(col);
  if (over) return;
  turn = 2;
  statusEl.textContent = `You played column ${col + 1}. Thinking…`;
  render();
  // Let the disc land before the computer moves, and keep the page responsive while it thinks.
  setTimeout(() => {
    const reply = bestMove(board, 2, LEVELS[levelEl.value as Level]);
    last = [landingRow(board, reply), reply];
    board = drop(board, reply, 2);
    turn = 1;
    afterMove(reply);
    if (over) return;
    statusEl.textContent = `The computer played column ${reply + 1}. Your turn.`;
    columnButtons[col].focus();
    render();
  }, 450);
}

$("restart").addEventListener("click", () => {
  board = emptyBoard();
  turn = 1;
  over = false;
  last = null;
  statusEl.textContent = "Your turn. Drop a disc.";
  render();
  columnButtons[3].focus();
});

render();
