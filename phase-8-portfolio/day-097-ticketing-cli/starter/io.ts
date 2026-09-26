// Already written: everything the CLI touches in the outside world, passed in, so tests can fake it.
import type { Fetch } from "./api.ts";

export interface Io {
  argv: string[]; // without "node" and the script
  env: Record<string, string | undefined>;
  home: string;
  fetch: Fetch;
  out(text: string): void; // stdout
  err(text: string): void; // stderr
  isTTY: boolean; // is a person watching, or is the output going to a file or another program?
  columns: number; // the terminal's width
  prompt(question: string, options: { hidden: boolean }): Promise<string>;
  sleep(ms: number): Promise<void>;
  now(): number;
}

export const VERSION = "1.0.0";

export const USAGE = `tikiti: buy event tickets from your terminal

Usage:
  tikiti login <email>                       log in (asks for your password)
  tikiti logout
  tikiti events [--json]                     what's on sale
  tikiti buy <event> --phone <number> [--quantity N] [--no-wait]
                                             hold seats and pay with M-Pesa
  tikiti order <order> [--json]              an order and its ticket codes
  tikiti help | --help, tikiti --version

Settings:
  TIKITI_URL       the API (default http://localhost:3066)
  TIKITI_PASSWORD  log in without being asked (for scripts)
  NO_COLOR         turn colours off
`;
