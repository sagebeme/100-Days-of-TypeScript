import { addEntry, loadLedger, saveLedger, summarize } from "./ledger.ts";

const ADD_USAGE = "Usage: add <income|expense> <amount> <label>";

export async function runCommand(
  args: string[],
  filePath: string,
  today: string = new Date().toISOString().slice(0, 10),
): Promise<string> {
  const command: string | undefined = args[0];
  const rest = args.slice(1);

  switch (command) {
    case undefined:
      throw new Error("Usage: add | list | summary");

    case "add": {
      const [kind, amountText, ...labelWords] = rest;
      if ((kind !== "income" && kind !== "expense") || amountText === undefined || labelWords.length === 0) {
        throw new Error(ADD_USAGE);
      }
      const amount = Number(amountText);
      const label = labelWords.join(" ");

      const ledger = await loadLedger(filePath);
      const updated = addEntry(ledger, { kind, amount, label, date: today });
      await saveLedger(filePath, updated);
      return `Added ${kind} KES ${amount}: ${label}`;
    }

    case "summary": {
      const { income, expenses, balance } = summarize(await loadLedger(filePath));
      return `Income: KES ${income}\nExpenses: KES ${expenses}\nBalance: KES ${balance}`;
    }

    case "list": {
      const { entries } = await loadLedger(filePath);
      if (entries.length === 0) {
        return "No entries yet";
      }
      return entries
        .map((e) => `#${e.id} ${e.date} ${e.kind.padEnd(7)} KES ${e.amount} ${e.label}`)
        .join("\n");
    }

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
