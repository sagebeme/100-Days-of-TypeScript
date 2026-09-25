import { mountRiderRush } from "./app.ts";

mountRiderRush(document, {
  random: Math.random,
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (id) => cancelAnimationFrame(id),
  storage: localStorage,
  openAudio: () => new AudioContext(),
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
});
