// SPDX-License-Identifier: AGPL-3.0-or-later
import "@frontend-testing/vitest-browser-navigate";
import {
  serverManager,
  stubJsonResponse,
} from "@frontend-testing/server-stubs";
import { setupWorker } from "msw/browser";
import { afterAll, afterEach, beforeAll, beforeEach, expect } from "vitest";
import { cleanup } from "vitest-browser-react";
import { queryClient } from "@/client/query-client";
import "@/styles.css";
const worker = setupWorker();
const unexpectedRequests: string[] = [];
serverManager.setDefaultServerLoader(() => worker);
beforeAll(async () => {
  await worker.start({
    onUnhandledRequest(request, print) {
      if (new URL(request.url).pathname.startsWith("/v2/")) {
        unexpectedRequests.push(`${request.method} ${request.url}`);
        print.error();
      }
    },
    quiet: true,
  });
});
// Web analytics is off unless a test turns it on (#57).
beforeEach(() => {
  stubJsonResponse({
    path: "*/v2/public/analytics/web",
    response: { enabled: false },
  });
});
afterEach(async () => {
  await cleanup();
  worker.resetHandlers();
  queryClient.clear();
  localStorage.clear();
  sessionStorage.clear();
  expect(unexpectedRequests.splice(0), "Unexpected API requests").toEqual([]);
});
afterAll(() => {
  worker.stop();
  serverManager.reset();
});
