import { defineConfig } from "vite";

export default defineConfig({
  // "./" makes every link in the build relative, so the game works wherever it's uploaded:
  // the root of a site (my-game.netlify.app) or a sub-folder (you.github.io/rider-rush/).
  base: "./",
  build: {
    // Every browser from the last few years runs this, and it keeps the output small.
    target: "es2022",
  },
});
