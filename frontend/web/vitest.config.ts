// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig, mergeConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { navigate } from "@frontend-testing/vitest-browser-navigate";
import viteConfig from "./vite.config.ts";
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ["src/**/*.spec.tsx"],
      setupFiles: ["src/test/setup.browser.ts"],
      testTimeout: 15000,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: "chromium" }],
        commands: { navigate },
      },
    },
  }),
);
