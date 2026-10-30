// SPDX-License-Identifier: AGPL-3.0-or-later
import { QueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 15000, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
});
/** What the installed app shows without a network: the catalogue and the person's bookings (#24). */
const OFFLINE_QUERIES = [
  "municipalities",
  "session",
  "facilities",
  "sports",
  "bookings",
  "access-pass",
  "notifications",
  "penalty",
];
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
// Kept answers stay in memory as long as on the device, or they would be dropped
// from both a few minutes after leaving the page.
for (const key of OFFLINE_QUERIES)
  queryClient.setQueryDefaults([key], { gcTime: MAX_AGE });
/** Raise it when the shape of a kept answer changes, so older copies are dropped. */
const OFFLINE_FORMAT = "1";
export const offlineCache: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister: createSyncStoragePersister({
    storage: window.localStorage,
    // The app and the backoffice share the origin, so each keeps its own copy.
    key: "quenda.app.offline",
    // Written at once: a reload right after signing in must not bring back the old session.
    throttleTime: 0,
  }),
  maxAge: MAX_AGE,
  buster: OFFLINE_FORMAT,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === "success" &&
      OFFLINE_QUERIES.includes(String(query.queryKey[0])),
  },
};
