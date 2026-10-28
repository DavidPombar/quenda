// SPDX-License-Identifier: AGPL-3.0-or-later
import tseslint from "typescript-eslint";
export default tseslint.config(
  {
    ignores: [
      ".claude/worktrees/**",
      "**/node_modules/**",
      "**/dist/**",
      "**/public/mockServiceWorker.js",
      "**/test-results/**",
      "**/coverage/**",
      "**/.vite/**",
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["backend/src/**/*.ts"],
    ignores: ["**/*.spec.ts"],
    languageOptions: {
      parserOptions: {
        project: "./backend/tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: { "@typescript-eslint/no-floating-promises": "error" },
  },
);
