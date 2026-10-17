// SPDX-License-Identifier: AGPL-3.0-or-later
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
export default defineConfig({
  plugins: [react()],
  base: "/app/",
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    port: 5174,
    strictPort: true,
    proxy: { "/v2": "http://127.0.0.1:3001", "/api": "http://127.0.0.1:3001" },
  },
});
