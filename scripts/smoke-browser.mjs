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
    .getByRole("link", { name: "Declaración de accesibilidade", exact: true })
    .click();
  await page.waitForURL(/\/accesibilidade$/);
  await page
    .getByRole("heading", { level: 1, name: "Declaración de accesibilidade" })
    .waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Website statement mobile overflow",
  );
  await audit("accessibility-website");
  await page.goto(base);
  await page
    .getByRole("link", { name: "Abrir a aplicación", exact: true })
    .click();
  // The app opens on the catalogue shared by every municipality (#18); booking happens inside one.
  await page.waitForURL(/\/app\/$/);
  await page
    .getByRole("heading", { name: "Instalacións deportivas da contorna" })
    .waitFor();
  // Every demo municipality has a "Pavillón municipal".
  await page
    .getByRole("heading", { name: "Pavillón municipal" })
    .first()
    .waitFor();
  await audit("shared-catalog");
  await page
    .getByRole("link", { name: "Concello de Portomar", exact: true })
    .first()
    .click();
  await page.waitForURL(/\/app\/portomar\/instalacions$/);
  await page
    .getByRole("heading", {
      level: 1,
      name: "Instalacións deportivas",
      exact: true,
    })
    .waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("heading", { name: "Pavillón municipal" }).waitFor();
  await audit("catalog");
  await page.screenshot({
    path: ".dev-logs/catalog-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Accesibilidade", exact: true })
    .first()
    .click();
  await page.waitForURL(/\/app\/[^/]+\/accesibilidade$/);
  await page
    .getByRole("heading", { level: 1, name: "Declaración de accesibilidade" })
    .waitFor();
  await audit("accessibility-app");
  await page.goBack();
  await page.getByRole("heading", { name: "Pavillón municipal" }).waitFor();
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
  await page.getByRole("button", { name: "Mostrar QR" }).first().click();
  await page
    .getByRole("img", { name: /Código QR do pase de acceso/ })
    .waitFor();
  await audit("access-pass");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Pechar" })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const calendarDownload = await page
    .getByRole("link", { name: "Engadir ao calendario" })
    .first()
    .getAttribute("href");
  const calendarResponse = await page.request.get(
    new URL(calendarDownload, base).toString(),
  );
  assert.equal(calendarResponse.status(), 200);
  assert.match(await calendarResponse.text(), /BEGIN:VCALENDAR/);
  await page
    .getByRole("button", { name: "Crear ligazón de subscrición" })
    .click();
  const feedLink = page.getByRole("textbox", {
    name: "Ligazón de subscrición",
  });
  await feedLink.waitFor();
  const feedUrl = await feedLink.inputValue();
  assert.equal((await page.request.get(feedUrl)).status(), 200);
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
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Calendar feed mobile overflow",
  );
  await audit("history-mobile");
  await page.screenshot({
    path: ".dev-logs/calendar-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
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
  // The help links live in the sidebar on desktop and in the footer on small screens.
  await page.getByRole("link", { name: "Datos abertos", exact: true }).click();
  await page
    .getByRole("heading", { name: "Datos abertos", level: 1 })
    .waitFor();
  await audit("open-data");
  const geojson = await page.request.get(
    await page
      .getByRole("link", { name: "GeoJSON", exact: true })
      .getAttribute("href")
      .then((href) => new URL(href, page.url()).toString()),
  );
  assert.equal(geojson.status(), 200, "Open data GeoJSON download");
  assert.equal(
    (await geojson.json()).type,
    "FeatureCollection",
    "Open data GeoJSON type",
  );
  await page.getByRole("link", { name: "A miña conta", exact: true }).click();
  await page.getByRole("heading", { name: "Conta e privacidade" }).waitFor();
  await audit("account");
  await page.screenshot({ path: ".dev-logs/account.png", fullPage: true });
  await page.getByRole("button", { name: "Eliminar a conta" }).click();
  await page.getByRole("alertdialog").waitFor();
  await audit("delete-account");
  await page.getByRole("button", { name: "Si, eliminar a conta" }).click();
  await page.getByRole("alertdialog").waitFor({ state: "hidden" });
  assert.equal(
    (await page.request.get(feedUrl)).status(),
    404,
    "Deleted accounts revoke calendar subscriptions",
  );
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Entrar", exact: true })
    .waitFor();
  await page.getByRole("link", { name: "Coñece Quenda", exact: true }).click();
  await page
    .getByRole("link", { name: "Explorar a demo municipal", exact: true })
    .click();
  // The backoffice opens on a choice between municipalities and the supramunicipal area (#18).
  await page.waitForURL(/\/admin\/$/);
  await page
    .getByRole("link", { name: "Entrar na área supramunicipal" })
    .waitFor();
  await audit("admin-entry");
  await page
    .getByRole("link", { name: "Concello de Portomar", exact: true })
    .click();
  await page.waitForURL(/\/admin\/portomar\/xestion$/);
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
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar datos", exact: true })
    .click();
  const download = await downloadPromise;
  const exported = JSON.parse(await fs.readFile(await download.path(), "utf8"));
  assert.equal(exported.format, "quenda-municipality-export");
  assert.equal(exported.version, 2);
  for (const collection of [
    "consents",
    "legalTexts",
    "logos",
    "bookingBlocks",
    "notificationPreferences",
    "messages",
  ])
    assert.ok(Array.isArray(exported[collection]), collection);
  await audit("management");
  await page.screenshot({ path: ".dev-logs/management.png", fullPage: true });
  await page.getByRole("link", { name: "Auditoría", exact: true }).click();
  await page.waitForURL(/\/admin\/[^/]+\/auditoria$/);
  await page.getByRole("heading", { level: 1, name: "Auditoría" }).waitFor();
  await audit("audit-log");
  await page.screenshot({ path: ".dev-logs/audit-log.png", fullPage: true });
  await page
    .getByRole("link", { name: "Accesibilidade", exact: true })
    .first()
    .click();
  await page.waitForURL(/\/admin\/[^/]+\/accesibilidade$/);
  await page
    .getByRole("heading", { level: 1, name: "Declaración de accesibilidade" })
    .waitFor();
  await audit("accessibility-admin");
  await page.getByRole("link", { name: "Axustes", exact: true }).click();
  await page
    .getByRole("region", { name: "Deportes" })
    .getByRole("textbox", { name: "Nome en galego" })
    .first()
    .waitFor();
  await audit("sports-settings");
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
    .click();
  await page
    .getByRole("button", { name: "Entrar como control de accesos" })
    .click();
  await page.waitForURL(/\/admin\/vilaverde\/acceso$/);
  await page
    .getByRole("heading", { level: 1, name: "Control de accesos" })
    .waitFor();
  await page.getByRole("heading", { name: "Reservas de hoxe" }).waitFor();
  await audit("access-control");
  await page.getByRole("link", { name: "Coñece Quenda", exact: true }).click();
  await page
    .getByRole("heading", {
      name: "Reserva as pistas e piscinas do teu concello.",
    })
    .waitFor();
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(
    "Website → citizen app → admin → website navigation, role isolation, deep-link reloads, native selects and real booking flow passed. Calendar downloads, subscription revocation, municipal data export and twenty-two accessibility scans, including the three accessibility statements passed.",
  );
} finally {
  await browser.close();
}
