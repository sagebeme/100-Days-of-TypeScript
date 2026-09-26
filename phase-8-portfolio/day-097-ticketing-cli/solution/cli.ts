#!/usr/bin/env node
// Already written: run the CLI with the real world plugged in.
//   node phase-8-portfolio/day-097-ticketing-cli/starter/cli.ts events
import { homedir } from "node:os";
import { createInterface } from "node:readline/promises";
import { run } from "./run.ts";

async function prompt(question: string, { hidden }: { hidden: boolean }): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: process.stdin.isTTY });
  if (hidden) {
    // Echo nothing while the password is typed.
    const write = (rl as unknown as { _writeToOutput(s: string): void })._writeToOutput;
    (rl as unknown as { _writeToOutput(s: string): void })._writeToOutput = (s) => (s.startsWith(question) ? write.call(rl, s) : undefined);
  }
  const answer = await rl.question(question);
  if (hidden) process.stderr.write("\n");
  rl.close();
  return answer;
}

process.exitCode = await run({
  argv: process.argv.slice(2),
  env: process.env,
  home: homedir(),
  fetch,
  out: (text) => void process.stdout.write(text),
  err: (text) => void process.stderr.write(text),
  isTTY: Boolean(process.stdout.isTTY),
  columns: process.stdout.columns ?? 80,
  prompt,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now: Date.now,
});
