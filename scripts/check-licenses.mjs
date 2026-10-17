// SPDX-License-Identifier: AGPL-3.0-or-later
import fs from "node:fs";
import path from "node:path";
const approved = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "MPL-2.0",
  "AGPL-3.0-or-later",
  "CC0-1.0",
  "CC-BY-4.0",
  "Python-2.0",
  "Unlicense",
  "BlueOak-1.0.0",
  "OFL-1.1",
]);
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));
const issues = [];
const licenses = new Map();
for (const [location, entry] of Object.entries(lock.packages)) {
  if (!location.includes("node_modules/") || entry.link) continue;
  const manifest = path.join(location, "package.json");
  if (!fs.existsSync(manifest)) continue;
  const pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
  const expression =
    (typeof pkg.license === "string" ? pkg.license : pkg.license?.type) ??
    (typeof entry.license === "string" ? entry.license : undefined) ??
    (Array.isArray(pkg.licenses)
      ? pkg.licenses.map((value) => value.type).join(" OR ")
      : reviewedLicense(pkg, location));
  if (typeof expression !== "string") {
    issues.push(`${pkg.name}: missing license`);
    continue;
  }
  const alternatives = expression.replace(/[()]/g, "").split(/\s+OR\s+/);
  if (
    !alternatives.some((alternative) =>
      alternative
        .split(/\s+AND\s+/)
        .every((value) => approved.has(value.trim())),
    )
  )
    issues.push(`${pkg.name}: review ${expression}`);
  licenses.set(expression, (licenses.get(expression) ?? 0) + 1);
}
console.log(Object.fromEntries(licenses));
if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
console.log(
  "All installed dependency licenses passed the free-software allowlist.",
);

function reviewedLicense(pkg, location) {
  const reviewed = {
    "map-stream@0.1.0": "LICENCE",
    "pause-stream@0.0.11": "LICENSE",
  };
  const filename = reviewed[`${pkg.name}@${pkg.version}`];
  if (!filename) return undefined;
  const content = fs
    .readFileSync(path.join(location, filename), "utf8")
    .replace(/\s+/g, " ");
  if (
    content.includes("Permission is hereby granted, free of charge") &&
    content.includes("WITHOUT WARRANTY OF ANY KIND") &&
    content.includes("IN NO EVENT SHALL THE AUTHORS")
  )
    return "MIT";
  return undefined;
}
