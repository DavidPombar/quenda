// SPDX-License-Identifier: AGPL-3.0-or-later
// Runs axe (WCAG 2.1 A and AA) on one page of a running instance and prints the violations.
//   node scripts/axe-page.mjs http://127.0.0.1:5173/app/portomar/instalacions [--mobile]
// It writes .dev-logs/axe-page.json and exits with 1 when there are violations.
import fs from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/axe-page.mjs <url> [--mobile]");
  process.exit(2);
}
const mobile = process.argv.includes("--mobile");
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: mobile
      ? { width: 375, height: 812 }
      : { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const violations = result.violations.map((value) => ({
    id: value.id,
    impact: value.impact,
    nodes: value.nodes.map((node) => node.target),
  }));
  await fs.mkdir(".dev-logs", { recursive: true });
  await fs.writeFile(
    ".dev-logs/axe-page.json",
    JSON.stringify(violations, null, 2),
  );
  console.log(
    violations.length
      ? JSON.stringify(violations, null, 2)
      : `No axe violations at ${url}.`,
  );
  process.exitCode = violations.length ? 1 : 0;
} finally {
  await browser.close();
}
