// The extension's background service worker: whenever something might have changed (the settings,
// or simply the time), it turns the blocking rules on or off.
import { chromeApi, loadSettings } from "./chrome.ts";
import { isFocusing, toRules } from "./rules.ts";

async function sync(): Promise<void> {
  if (!chromeApi) return;
  const settings = await loadSettings();
  const focusing = isFocusing(new Date(), settings);
  const existing = await chromeApi.declarativeNetRequest.getDynamicRules();
  await chromeApi.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((r) => r.id),
    addRules: focusing ? toRules(settings.blocklist) : [],
  });
  await chromeApi.action.setBadgeBackgroundColor({ color: "#4338ca" });
  await chromeApi.action.setBadgeText({ text: focusing ? "ON" : "" });
}

if (chromeApi) {
  chromeApi.runtime.onInstalled.addListener(() => void sync());
  chromeApi.runtime.onStartup.addListener(() => void sync());
  chromeApi.storage.onChanged.addListener(() => void sync());
  chromeApi.alarms.create("tick", { periodInMinutes: 1 }); // schedules start and end on the minute
  chromeApi.alarms.onAlarm.addListener(() => void sync());
}
