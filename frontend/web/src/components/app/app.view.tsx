// SPDX-License-Identifier: AGPL-3.0-or-later
import { ChakraProvider } from "@chakra-ui/react";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router";
import { system } from "@/theme/system";
export function App() {
  return (
    <ChakraProvider value={system}>
      <RouterProvider router={router} />
    </ChakraProvider>
  );
}
