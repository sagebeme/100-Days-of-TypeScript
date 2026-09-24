// Already written for you: this connects your runCommand to the terminal.
// Usage (from the repo root):
//   node phase-2-modelling/day-028-side-hustle-money-tracker/starter/cli.ts add income 5000 "Logo design"
import { runCommand } from "./commands.ts";

const filePath = process.env.MONEY_FILE ?? "money.json";

try {
  console.log(await runCommand(process.argv.slice(2), filePath));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
