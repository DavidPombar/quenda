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
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/app": { target: "http://127.0.0.1:5174", ws: true },
      "/admin": { target: "http://127.0.0.1:5175", ws: true },
      // Keep the browser's Host so the API builds absolute URLs (open data) for this origin.
      "/v2": { target: "http://127.0.0.1:3001", changeOrigin: false },
      "/api": { target: "http://127.0.0.1:3001", changeOrigin: false },
    },
  },
});
