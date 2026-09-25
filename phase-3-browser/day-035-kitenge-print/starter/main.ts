import { mountKitenge } from "./app.ts";

mountKitenge(document, { width: 800, height: 500, tile: 50, seed: Math.floor(Math.random() * 1000) });
