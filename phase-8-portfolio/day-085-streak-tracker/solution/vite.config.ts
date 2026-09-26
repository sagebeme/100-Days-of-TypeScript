import { defineConfig } from "vite";
import { resolve } from "node:path";

// The service worker is built as its own file, sw.js, next to index.html: a service worker can only
// look after pages at or below its own folder.
export default defineConfig({
  build: {
    rollupOptions: {
      input: { main: resolve(import.meta.dirname, "index.html"), sw: resolve(import.meta.dirname, "sw.ts") },
      output: { entryFileNames: (chunk) => (chunk.name === "sw" ? "sw.js" : "assets/[name]-[hash].js") },
    },
  },
});
