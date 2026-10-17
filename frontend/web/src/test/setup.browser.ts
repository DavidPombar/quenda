// SPDX-License-Identifier: AGPL-3.0-or-later
import "@frontend-testing/vitest-browser-navigate";
import { afterEach } from "vitest";
import { cleanup } from "vitest-browser-react";
import "@/styles.css";
afterEach(async () => {
  await cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
