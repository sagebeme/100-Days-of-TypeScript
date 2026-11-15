// typescript-eslint needs TypeScript's JavaScript API, which TypeScript 7 doesn't ship. So package.json installs
// TypeScript 6 as `typescript` (the API) and TypeScript 7 as `@typescript/native` (the `tsc` that typecheck runs).
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/node_modules/", "**/.next/", "**/dist/", "**/coverage/", "**/test-results/", "**/.build-*/", "**/next-env.d.ts"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // Course code runs in Node (scripts, servers) and in the browser (Phase 3 on).
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // `const { id, ...rest } = x` is how the course drops fields, and a leading _ marks a parameter kept only for its signature.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", ignoreRestSiblings: true }],
    },
  },
  {
    // Starters are unfinished on purpose: stubs keep parameters and fields the learner hasn't used yet,
    // `let` variables they'll reassign, and `{}` placeholders a TODO says to replace. The finished code in
    // solution/ is linted with every rule on.
    files: ["phase-*/**/starter/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-unused-private-class-members": "off",
      "no-useless-assignment": "off",
      "prefer-const": "off",
    },
  },
]);
