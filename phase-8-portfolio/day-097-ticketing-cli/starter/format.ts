// Output for people: colour only when it helps, and tables that fit the terminal. The tests are the spec.

// NO_COLOR (any non-empty value) turns colour off, FORCE_COLOR turns it on ("0" means off), a "dumb"
// terminal gets none, and otherwise: colour only for a terminal.
export function shouldColor(env: Record<string, string | undefined>, isTTY: boolean): boolean {
  throw new Error(`TODO: shouldColor(${Object.keys(env)}, ${isTTY})`);
}

// Already written: wrap text in ANSI colour codes, or not.
const style = (open: number, close: number) => (on: boolean) => (text: string) => (on ? `\x1b[${open}m${text}\x1b[${close}m` : text);
export function painter(on: boolean) {
  return { bold: style(1, 22)(on), dim: style(2, 22)(on), green: style(32, 39)(on), red: style(31, 39)(on), yellow: style(33, 39)(on) };
}
export type Paint = ReturnType<typeof painter>;

// How wide text looks: colour codes take no room, and an emoji is one character.
export function visibleWidth(text: string): number {
  throw new Error(`TODO: visibleWidth(${text})`);
}

export interface Column {
  header: string;
  align?: "left" | "right";
  shrink?: boolean; // this column gives up room when the table is too wide
}

// Columns as wide as their widest cell, two spaces apart. Too wide? Shrinkable columns give up room,
// cut with "…". Lines never end in spaces.
export function table(rows: string[][], columns: Column[], maxWidth: number): string {
  throw new Error(`TODO: table(${rows.length} rows, ${columns.length} columns, ${maxWidth})`);
}

export const kes = (n: number) => `KES ${n.toLocaleString("en-KE")}`;

// "Sat 12 Dec 2026, 18:00", in Nairobi: where the events are.
export function when(iso: string, timeZone = "Africa/Nairobi"): string {
  throw new Error(`TODO: when(${iso}, ${timeZone})`);
}
