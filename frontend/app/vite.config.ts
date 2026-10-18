// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [react()],
  // Long-lived vendor chunks keep each file under Vite's size warning and
  // let browsers cache libraries across releases.
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: "chakra",
              test: /node_modules[\\/](@chakra-ui|@ark-ui|@zag-js|@emotion|@pandacss)[\\/]/,
            },
            { name: "vendor", test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  base: "/app/",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5174,
    strictPort: true,
    proxy: { "/v2": "http://127.0.0.1:3001", "/api": "http://127.0.0.1:3001" },
  },
});
