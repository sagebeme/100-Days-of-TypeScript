// Output for people: colour only when it helps, and tables that fit the terminal.

// Colour codes in a file or a pipe are junk: "\x1b[32mpaid\x1b[39m". Follow the conventions:
// NO_COLOR (any value) turns colour off, FORCE_COLOR turns it on, and a "dumb" terminal gets none.
export function shouldColor(env: Record<string, string | undefined>, isTTY: boolean): boolean {
  if (env.NO_COLOR) return false;
  if (env.FORCE_COLOR !== undefined) return env.FORCE_COLOR !== "0";
  if (env.TERM === "dumb") return false;
  return isTTY;
}

const style = (open: number, close: number) => (on: boolean) => (text: string) => (on ? `\x1b[${open}m${text}\x1b[${close}m` : text);
const bold = style(1, 22);
const dim = style(2, 22);
const green = style(32, 39);
const red = style(31, 39);
const yellow = style(33, 39);

export function painter(on: boolean) {
  return { bold: bold(on), dim: dim(on), green: green(on), red: red(on), yellow: yellow(on) };
}
export type Paint = ReturnType<typeof painter>;

// How wide text looks: colour codes take no room, and an emoji is one character, not two code units.
export function visibleWidth(text: string): number {
  return [...text.replace(/\x1b\[[0-9;]*m/g, "")].length;
}

export interface Column {
  header: string;
  align?: "left" | "right";
  shrink?: boolean; // this column gives up room when the table is too wide
}

const GAP = "  ";

function truncate(text: string, width: number): string {
  if (visibleWidth(text) <= width) return text;
  return [...text].slice(0, Math.max(0, width - 1)).join("") + "…";
}

// Columns as wide as their widest cell. Too wide for the terminal? The shrinkable columns give up
// room (widest first), cut with "…". Lines never end in spaces.
export function table(rows: string[][], columns: Column[], maxWidth: number): string {
  const all = [columns.map((c) => c.header), ...rows];
  const widths = columns.map((_, i) => Math.max(...all.map((row) => visibleWidth(row[i] ?? ""))));
  let over = widths.reduce((a, b) => a + b, 0) + GAP.length * (columns.length - 1) - maxWidth;
  while (over > 0) {
    const candidates = columns.map((c, i) => i).filter((i) => columns[i].shrink && widths[i] > Math.max(4, visibleWidth(columns[i].header)));
    if (candidates.length === 0) break;
    const widest = candidates.reduce((a, b) => (widths[b] > widths[a] ? b : a));
    widths[widest]--;
    over--;
  }
  return all
    .map((row) =>
      columns
        .map((column, i) => {
          const cell = truncate(row[i] ?? "", widths[i]);
          const padding = " ".repeat(widths[i] - visibleWidth(cell));
          return column.align === "right" ? padding + cell : cell + padding;
        })
        .join(GAP)
        .trimEnd(),
    )
    .join("\n");
}

export const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

// "Sat 12 Dec 2026, 18:00", in Nairobi: where the events are.
export function when(iso: string, timeZone = "Africa/Nairobi"): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}`;
}
