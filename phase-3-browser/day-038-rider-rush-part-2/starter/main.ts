import { mountRiderRush } from "./app.ts";

mountRiderRush(document, {
  random: Math.random,
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (id) => cancelAnimationFrame(id),
  storage: localStorage,
});
