// SPDX-License-Identifier: AGPL-3.0-or-later
import { ChakraProvider } from "@chakra-ui/react";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { RouterProvider } from "react-router-dom";
import { offlineCache, queryClient } from "@/client/query-client";
import { router } from "@/router";
import { system } from "@/theme/system";
export function App() {
  return (
    <ChakraProvider value={system}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={offlineCache}
        // Kept answers show at once and are refreshed when there is a network.
        onSuccess={() => queryClient.invalidateQueries()}
      >
        <RouterProvider router={router} />
      </PersistQueryClientProvider>
    </ChakraProvider>
  );
}
