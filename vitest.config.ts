import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["phase-*/**/*.test.ts"],
    // Phase 3 tests opt in to a fake browser with `// @vitest-environment happy-dom`.
    // Tests never load a page's CSS or script files over the network.
    environmentOptions: {
      happyDOM: {
        settings: {
          disableCSSFileLoading: true,
          disableJavaScriptFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
  },
});
