// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const base = process.env.SMOKE_URL ?? "http://127.0.0.1:5173";
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await fs.mkdir(".dev-logs", { recursive: true });
async function audit(name) {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect?.getComputedTiming().endTime !== Infinity,
        )
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const violations = result.violations.map((value) => ({
    id: value.id,
    nodes: value.nodes.map((node) => ({
      target: node.target,
      detail: node.failureSummary,
    })),
  }));
  await fs.writeFile(
    `.dev-logs/axe-${name}.json`,
    JSON.stringify(violations, null, 2),
  );
  assert.deepEqual(violations, [], `Accessibility failures on ${name}`);
}
try {
  await page.goto(base);
  await page
    .getByRole("heading", {
      name: "Reserva as pistas e piscinas do teu concello.",
    })
    .waitFor();
  await audit("website-desktop");
  await page.screenshot({
    path: ".dev-logs/website-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Website mobile overflow",
  );
  await audit("website-mobile");
  await page.screenshot({
    path: ".dev-logs/website-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Abrir a aplicación", exact: true })
    .click();
  await page.waitForURL(/\/app\/[^/]+\/instalacions$/);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("heading", { name: "Pavillón municipal" }).waitFor();
  await audit("catalog");
  await page.screenshot({
    path: ".dev-logs/catalog-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Mobile overflow",
  );
  await audit("mobile");
  await page.screenshot({
    path: ".dev-logs/catalog-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByText("Lin e acepto o aviso de privacidade").click();
  await page.getByRole("button", { name: "Entrar como cidadanía" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("link", { name: "Pistas de pádel da Carballeira", exact: true })
    .click();
  await page.reload();
  await page
    .getByRole("heading", {
      name: "Pistas de pádel da Carballeira",
      exact: true,
    })
    .waitFor();
  await page.getByRole("button", { name: /^Mañá/ }).click();
  await page.getByRole("button", { name: /Libre/ }).first().click();
  await audit("confirmation");
  await page
    .getByRole("button", { name: "Confirmar reserva", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "A túa quenda está confirmada!" })
    .waitFor();
  await page.getByRole("link", { name: "Ver as miñas reservas" }).click();
  await page.getByRole("button", { name: "Cambiar quenda" }).first().click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /^\d{2}:\d{2}\s*Libre$/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Confirmar cambio" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Cancelar reserva", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Si, cancelar reserva" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Historial", exact: true }).click();
  await page.getByText("Cancelada", { exact: true }).first().waitFor();
  await audit("history");
  await page.screenshot({ path: ".dev-logs/bookings.png", fullPage: true });
  assert.equal(
    await page
      .getByRole("link", { name: "Xestión municipal", exact: true })
      .count(),
    0,
  );
  await page.getByRole("link", { name: "Instalacións", exact: true }).click();
  await page
    .getByRole("link", { name: "Pavillón municipal", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Pavillón municipal", exact: true })
    .waitFor();
  // Tomorrow always has open slots; late in the evening today has none and shows no grid.
  await page.getByRole("button", { name: /^Mañá/ }).click();
  await page
    .getByRole("combobox", { name: "Pista", exact: true })
    .selectOption({ label: "Todas as pistas" });
  await page
    .getByRole("table", { name: /Quendas de todas as pistas/ })
    .waitFor();
  await audit("resources-grid");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Resources grid mobile overflow",
  );
  await page.screenshot({
    path: ".dev-logs/resources-grid-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("link", { name: "A miña conta", exact: true }).click();
  await page.getByRole("heading", { name: "Conta e privacidade" }).waitFor();
  await audit("account");
  await page.screenshot({ path: ".dev-logs/account.png", fullPage: true });
  await page.getByRole("button", { name: "Eliminar a conta" }).click();
  await page.getByRole("alertdialog").waitFor();
  await audit("delete-account");
  await page.getByRole("button", { name: "Si, eliminar a conta" }).click();
  await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Entrar", exact: true })
    .waitFor();
  await page.getByRole("link", { name: "Coñece Quenda", exact: true }).click();
  await page
    .getByRole("link", { name: "Explorar a demo municipal", exact: true })
    .click();
  await page.waitForURL(/\/admin\/[^/]+\/xestion$/);
  await page
    .getByRole("heading", { name: "Este espazo é para o persoal municipal." })
    .waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Nova instalación" }).count(),
    0,
  );
  await page
    .getByRole("button", { name: "Entrar", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Entrar como xestor/a" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Nova instalación" }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: "Nova instalación" }).waitFor();
  await audit("management");
  await page.screenshot({ path: ".dev-logs/management.png", fullPage: true });
  await page.getByRole("link", { name: "Auditoría", exact: true }).click();
  await page.waitForURL(/\/admin\/[^/]+\/auditoria$/);
  await page.getByRole("heading", { level: 1, name: "Auditoría" }).waitFor();
  await audit("audit-log");
  await page.screenshot({ path: ".dev-logs/audit-log.png", fullPage: true });
  await page.getByRole("link", { name: "Panel", exact: true }).click();
  await page.getByRole("button", { name: "Nova instalación" }).waitFor();
  await page.getByRole("button", { name: "Nova instalación" }).click();
  const editor = page.getByRole("dialog");
  await editor
    .getByRole("combobox", { name: "Deporte", exact: true })
    .selectOption("tennis");
  await editor
    .getByRole("combobox", { name: "Estado", exact: true })
    .selectOption("maintenance");
  await editor
    .getByRole("combobox", { name: "Duración da quenda (min)" })
    .selectOption("90");
  await audit("facility-editor");
  await page.getByRole("button", { name: "Pechar", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Concello", exact: true })
    .selectOption("vilaverde");
  await page.waitForURL(/\/admin\/vilaverde\/xestion$/);
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Entrar", exact: true })
    .waitFor();
  await page.getByRole("link", { name: "Coñece Quenda", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Reserva as pistas e piscinas do teu concello.",
    })
    .waitFor();
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(
    "Website → citizen app → admin → website navigation, role isolation, deep-link reloads, native selects and real booking flow passed. Twelve accessibility scans passed.",
  );
} finally {
  await browser.close();
}
