// Already written: just the parts of Chrome's extension API this project uses, typed, and a settings
// store that falls back to localStorage outside an extension, so the pages can be opened as ordinary
// web pages while you design them.
import { DEFAULT_SETTINGS, type DnrRule, type Settings } from "./rules.ts";

interface ChromeApi {
  storage: {
    sync: { get(key: string): Promise<Record<string, unknown>>; set(items: Record<string, unknown>): Promise<void> };
    onChanged: { addListener(listener: () => void): void };
  };
  declarativeNetRequest: {
    getDynamicRules(): Promise<{ id: number }[]>;
    updateDynamicRules(options: { removeRuleIds: number[]; addRules: DnrRule[] }): Promise<void>;
  };
  alarms: { create(name: string, info: { periodInMinutes: number }): void; onAlarm: { addListener(listener: () => void): void } };
  action: { setBadgeText(details: { text: string }): Promise<void>; setBadgeBackgroundColor(details: { color: string }): Promise<void> };
  runtime: { onInstalled: { addListener(listener: () => void): void }; onStartup: { addListener(listener: () => void): void } };
}

export const chromeApi = (globalThis as { chrome?: ChromeApi }).chrome?.storage ? (globalThis as unknown as { chrome: ChromeApi }).chrome : null;

export async function loadSettings(): Promise<Settings> {
  try {
    const stored = chromeApi ? (await chromeApi.storage.sync.get("settings")).settings : JSON.parse(localStorage.getItem("focus-settings") ?? "null");
    return { ...DEFAULT_SETTINGS, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, ...(stored as Partial<Settings> | null) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  if (chromeApi) await chromeApi.storage.sync.set({ settings });
  else localStorage.setItem("focus-settings", JSON.stringify(settings));
}
