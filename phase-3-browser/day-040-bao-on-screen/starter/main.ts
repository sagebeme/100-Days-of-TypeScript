import { mountBao } from "./app.ts";

mountBao(document, {
  wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
});
