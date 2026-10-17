// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/app": { target: "http://127.0.0.1:5174", ws: true },
      "/admin": { target: "http://127.0.0.1:5175", ws: true },
      "/v2": "http://127.0.0.1:3001",
      "/api": "http://127.0.0.1:3001",
    },
  },
});
