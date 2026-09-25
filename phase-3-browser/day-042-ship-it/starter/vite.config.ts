import { defineConfig } from "vite";

export default defineConfig({
  // TODO: set `base` so every link in the build is relative ("./"). Without it, Vite writes links
  //   like "/assets/index.js", which break as soon as the game lives in a sub-folder.
  // TODO: set build.target to "es2022"
});
