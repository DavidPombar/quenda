// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["test/**/*.e2e-spec.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
