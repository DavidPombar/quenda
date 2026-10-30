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
/**
 * Kept on the device so door mode opens without a network (#24); the door data itself
 * lives in access-store.service.ts.
 */
const OFFLINE_QUERIES = ["municipalities", "session"];
const MAX_AGE = 24 * 60 * 60 * 1000;
for (const key of OFFLINE_QUERIES)
  queryClient.setQueryDefaults([key], { gcTime: MAX_AGE });
/** Raise it when the shape of a kept answer changes, so older copies are dropped. */
const OFFLINE_FORMAT = "1";
export const offlineCache: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister: createSyncStoragePersister({
    storage: window.localStorage,
    // The app and the backoffice share the origin, so each keeps its own copy.
    key: "quenda.admin.offline",
    // Tests clear the storage between cases; a delayed write would leak into the next one.
    throttleTime: import.meta.env.MODE === "test" ? 0 : 1000,
  }),
  maxAge: MAX_AGE,
  buster: OFFLINE_FORMAT,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      query.state.status === "success" &&
      OFFLINE_QUERIES.includes(String(query.queryKey[0])),
  },
};
