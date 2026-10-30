// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";
/** Files copied from public/ that the installed app needs without a network. */
const PUBLIC_FILES = [
  "favicon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "manifest.webmanifest",
];
/** The line of public/sw.js that the build replaces with the real list. */
const PLACEHOLDER = 'const PRECACHE = { version: "dev", files: [] };';
/**
 * Writes into the built sw.js every file the service worker keeps for offline use and a
 * version that changes whenever any of them does (#24). Browsers only install a new worker
 * when sw.js itself changes, so the list has to live inside it.
 */
export function precache(): Plugin {
  let worker = "";
  let manifest = { version: "", files: [] as string[] };
  return {
    name: "quenda-precache",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      worker = resolve(config.root, config.build.outDir, "sw.js");
    },
    generateBundle(_options, bundle) {
      const hash = createHash("sha256");
      const files = Object.keys(bundle)
        .filter((name) => !name.endsWith(".map"))
        .sort();
      for (const name of files) {
        const output = bundle[name];
        hash.update(name);
        hash.update(output.type === "chunk" ? output.code : output.source);
      }
      manifest = {
        version: hash.digest("hex").slice(0, 12),
        files: [...files, ...PUBLIC_FILES],
      };
    },
    // Public files are copied before the bundle is written, so sw.js is there by now.
    async closeBundle() {
      const source = await readFile(worker, "utf8");
      if (!source.includes(PLACEHOLDER))
        throw new Error(`${worker} lacks the precache placeholder`);
      await writeFile(
        worker,
        source.replace(
          PLACEHOLDER,
          `const PRECACHE = ${JSON.stringify(manifest)};`,
        ),
      );
    },
  };
}
