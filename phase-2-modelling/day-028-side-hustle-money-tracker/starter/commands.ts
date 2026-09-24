import { addEntry, loadLedger, saveLedger, summarize } from "./ledger.ts";

export async function runCommand(
  args: string[],
  filePath: string,
  today: string = new Date().toISOString().slice(0, 10),
): Promise<string> {
  // TODO: the first word is the command; no command at all: throw new Error("Usage: add | list | summary")
  // TODO: "add <income|expense> <amount> <label...>": load, addEntry (date: today), save, return `Added ${kind} KES ${amount}: ${label}`
  // TODO:   bad or missing arguments: throw new Error("Usage: add <income|expense> <amount> <label>")
  // TODO: "summary": return "Income: KES x\nExpenses: KES y\nBalance: KES z"
  // TODO: "list": one line per entry: `#${id} ${date} ${kind.padEnd(7)} KES ${amount} ${label}`, or "No entries yet"
  // TODO: anything else: throw new Error(`Unknown command: ${command}`)
  throw new Error("not implemented yet");
}
