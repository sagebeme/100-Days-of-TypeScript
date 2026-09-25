import { chromium, type Browser } from "playwright-core";
import { existsSync } from "node:fs";

// Places Chrome, Edge or Chromium usually live. CHROME_PATH wins if you set it.
const CANDIDATES = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

export function findChrome(env: Record<string, string | undefined> = process.env): string | null {
  if (env.CHROME_PATH && existsSync(env.CHROME_PATH)) return env.CHROME_PATH;
  return CANDIDATES.find((path) => existsSync(path)) ?? null;
}

// playwright-core drives a browser you already have, instead of downloading its own.
export async function launchBrowser(options: { headless?: boolean } = {}): Promise<Browser> {
  const executablePath = findChrome();
  if (executablePath === null) {
    throw new Error("No Chrome, Edge or Chromium found. Install one, or set CHROME_PATH to where it is.");
  }
  return chromium.launch({ executablePath, headless: options.headless ?? true });
}
