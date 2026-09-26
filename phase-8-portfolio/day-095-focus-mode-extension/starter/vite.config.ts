import { defineConfig } from "vite";
import { resolve } from "node:path";

// Builds the unpacked extension into dist/: the two pages, the background worker as background.js,
// and public/ (the manifest and icon) copied as they are.
export default defineConfig({
  base: "./",
  build: {
    target: "chrome120",
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, "popup.html"),
        blocked: resolve(import.meta.dirname, "blocked.html"),
        background: resolve(import.meta.dirname, "background.ts"),
      },
      output: { entryFileNames: (chunk) => (chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js") },
    },
  },
});
