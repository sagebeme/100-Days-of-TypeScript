// Your service worker. vite.config.ts builds it to sw.js next to index.html. Follow offline.ts:
// cache APP_SHELL on "install", delete old caches on "activate", and answer "fetch" by strategy.
import { APP_SHELL, VERSION } from "./offline.ts";

void [APP_SHELL, VERSION];
