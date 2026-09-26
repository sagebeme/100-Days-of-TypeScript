import type { Io } from "./io.ts";

// Exit codes: 0 done, 1 it didn't work, 2 the command itself was wrong.
export const OK = 0;
export const FAILED = 1;
export const USAGE_ERROR = 2;

export const POLL_INTERVAL_MS = 2_000;
export const POLL_TIMEOUT_MS = 120_000;

// Parse the command, run it against the API, and print for people (or for scripts, with --json).
// Results go to io.out; problems go to io.err, starting "✘ ". The tests are the spec.
export async function run(io: Io): Promise<number> {
  io.err(`TODO: tikiti ${io.argv.join(" ")}\n`);
  return FAILED;
}
