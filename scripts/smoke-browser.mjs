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
// Each audit() name is one row of the screen list in docs/architecture/accessibility.md (T5).
// Known violations, by scan and axe rule, each tracked in its own issue; any other fails.
const knownViolations = {};
const scans = [];
/**
 * WCAG 1.4.10 and 1.4.4: no page-level horizontal scroll at 320 px, the usual 390 px phone or
 * 640 px (200 % zoom on a 1280 px screen).
 */
async function assertReflow(label) {
  const size = page.viewportSize();
  for (const width of [320, 390, 640]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${label} overflows at ${width} px`,
    );
  }
  await page.setViewportSize(size);
}
/** Opens a route of the current session and scans it once its main heading is shown. */
async function auditRoute(name, path) {
  await page.goto(new URL(path, base).toString());
  await page.locator("main h1").first().waitFor();
  await page.waitForLoadState("networkidle");
  await audit(name);
}
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
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const known = knownViolations[name] ?? {};
  scans.push(name);
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
  assert.deepEqual(
    violations.filter((violation) => !known[violation.id]),
    [],
    `Accessibility failures on ${name}`,
  );
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
  await assertReflow("Website");
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
  await assertReflow("Website statement");
  await audit("accessibility-website");
  await auditRoute("website-search", "/instalacions");
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
  await page.setViewportSize({ width: 1440, height: 1000 });
  await audit("shared-catalog-desktop");
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
  await assertReflow("Catalogue");
  await audit("mobile");
  await page.screenshot({
    path: ".dev-logs/catalog-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Signed-out states of the personal pages and the e-mail unsubscribe page.
  await auditRoute("bookings-signed-out", "/app/portomar/reservas");
  await auditRoute("account-signed-out", "/app/portomar/conta");
  await auditRoute("unsubscribe", "/app/portomar/baixa");
  await page.goto(new URL("/app/portomar/instalacions", base).toString());
  await page.getByRole("heading", { name: "Pavillón municipal" }).waitFor();
  // Sign-in choices, the e-mail code steps (#8) and the privacy notice.
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByText("Lin e acepto o aviso de privacidade").click();
  await page.getByRole("textbox", { name: "Correo electrónico" }).waitFor();
  await audit("session-dialog");
  await page
    .getByRole("textbox", { name: "Correo electrónico" })
    .fill("smoke@example.org");
  await page.getByRole("button", { name: "Enviar código" }).click();
  // The request answers at once; the mail goes out in the background (#78).
  await page.getByRole("textbox", { name: "Código de 6 cifras" }).waitFor();
  await audit("email-code");
  await page
    .getByRole("button", { name: "Ler o aviso de privacidade" })
    .click();
  const privacy = page.getByRole("dialog", {
    name: "Privacidade nesta demostración",
  });
  await privacy.waitFor();
  await audit("privacy-notice");
  await page.keyboard.press("Escape");
  await privacy.waitFor({ state: "hidden" });
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
  await audit("booking-success");
  await page.getByRole("link", { name: "Ver as miñas reservas" }).click();
  await page.getByRole("button", { name: "Mostrar QR" }).first().waitFor();
  await audit("bookings-upcoming");
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
    .waitFor();
  await audit("change-booking");
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
  await page.getByRole("button", { name: "Si, cancelar reserva" }).waitFor();
  await audit("cancel-booking");
  await page.getByRole("button", { name: "Si, cancelar reserva" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Historial", exact: true }).click();
  await page.getByText("Cancelada", { exact: true }).first().waitFor();
  await audit("history");
  await page.setViewportSize({ width: 390, height: 844 });
  await assertReflow("Calendar feed");
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
  // Facility page (#26): photo with its alternative text, map and the week's opening hours.
  await page
    .getByRole("img", { name: /Pista do pavillón vista desde arriba/ })
    .waitFor();
  await page
    .getByRole("table", { name: "Horario dos próximos sete días" })
    .waitFor();
  await page
    .getByRole("region", { name: "Mapa da localización de Pavillón municipal" })
    .waitFor();
  await audit("facility-page");
  await page.screenshot({
    path: ".dev-logs/facility-page.png",
    fullPage: true,
  });
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
  await assertReflow("Resources grid");
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
  // The notice preferences load separately; scan them too.
  await page.getByRole("button", { name: "Gardar avisos" }).waitFor();
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
  await audit("admin-gate");
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
  await page.getByRole("link", { name: "Temporadas", exact: true }).click();
  await page.waitForURL(/\/admin\/[^/]+\/temporadas$/);
  await page.getByRole("heading", { level: 1, name: "Temporadas" }).waitFor();
  await page.getByRole("heading", { name: /Asignación de franxas/ }).waitFor();
  await audit("seasons");
  // Staff accounts (#8): the manager's «Persoal» page.
  await page.getByRole("link", { name: "Persoal", exact: true }).click();
  await page.waitForURL(/\/admin\/[^/]+\/persoal$/);
  await page
    .getByRole("heading", { level: 2, name: "Control de accesos" })
    .waitFor();
  await audit("staff");
  await page.screenshot({ path: ".dev-logs/seasons.png", fullPage: true });
  // Activities and sports schools (#97): a draft that becomes a published course, then the
  // citizen's catalogue and the activity's page. Dates a month ahead avoid the demo bookings.
  await page.getByRole("link", { name: "Actividades", exact: true }).click();
  await page.waitForURL(/\/admin\/[^/]+\/actividades$/);
  await page.getByRole("heading", { level: 1, name: "Actividades" }).waitFor();
  await audit("activities-admin");
  const activitySlug = new URL(page.url()).pathname.split("/")[2];
  const dayAhead = (days) =>
    new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  await page.getByRole("button", { name: "Nova actividade" }).click();
  const activityForm = page.getByRole("form", { name: "Nova actividade" });
  await activityForm
    .getByRole("textbox", { name: "Nome en galego" })
    .fill("Escola de pádel");
  await activityForm.getByRole("checkbox", { name: "Martes" }).check();
  await activityForm.getByRole("checkbox", { name: "Xoves" }).check();
  await activityForm.getByLabel("Hora de inicio").fill("20:00");
  await activityForm.getByLabel("Hora de fin").fill("21:00");
  await activityForm.getByLabel("Primeiro día").fill(dayAhead(30));
  await activityForm.getByLabel("Último día").fill(dayAhead(60));
  await activityForm.getByLabel("Inscrición ata").fill(dayAhead(29));
  await activityForm.getByRole("textbox", { name: "Prezo xeral (€)" }).fill("30");
  await activityForm.getByRole("button", { name: "Gardar borrador" }).click();
  const clashes = page.getByRole("button", { name: /como días? sen sesión/ });
  await Promise.race([
    page.getByText("Actividade gardada.").waitFor(),
    clashes.first().waitFor(),
  ]);
  if (await clashes.count()) {
    // Whatever the demo data holds then becomes a date without a session.
    const all = page.getByRole("button", { name: "Engadir todas como días sen sesión" });
    await ((await all.count()) ? all : clashes.first()).click();
    await activityForm.getByRole("button", { name: "Gardar borrador" }).click();
    await page.getByText("Actividade gardada.").waitFor();
  }
  await page.getByRole("heading", { name: "Editando: Escola de pádel" }).waitFor();
  await audit("activity-editor");
  await page.getByRole("button", { name: "Publicar", exact: true }).click();
  await page.getByText(/Actividade publicada/).waitFor();
  await page.getByRole("heading", { name: "Sesións: Escola de pádel" }).waitFor();
  await page.screenshot({ path: ".dev-logs/activities-admin.png", fullPage: true });
  await page.goto(`${base}/app/${activitySlug}/actividades`);
  await page
    .getByRole("heading", { level: 1, name: "Actividades e escolas deportivas" })
    .waitFor();
  await page.getByRole("link", { name: "Escola de pádel" }).waitFor();
  await audit("activities");
  await assertReflow("activities");
  await page.getByRole("link", { name: "Escola de pádel" }).click();
  await page.getByRole("heading", { level: 1, name: "Escola de pádel" }).waitFor();
  await page.getByRole("heading", { name: "Próximas sesións" }).waitFor();
  await audit("activity-page");
  await page.screenshot({ path: ".dev-logs/activity-page.png", fullPage: true });
  // The rest of the manager's pages, two of them also at phone widths.
  await auditRoute("admin-bookings", "/admin/portomar/reservas");
  const municipalCancel = page.getByRole("button", {
    name: "Cancelar",
    exact: true,
  });
  if (await municipalCancel.count()) {
    await municipalCancel.first().click();
    await page
      .getByRole("dialog", { name: "Cancelar a reserva en nome do concello" })
      .waitFor();
    await audit("admin-cancel-booking");
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await assertReflow("Day bookings");
  await audit("admin-bookings-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await auditRoute("admin-insights", "/admin/portomar/indicadores");
  await auditRoute("admin-categories", "/admin/portomar/categorias");
  await auditRoute("admin-settings", "/admin/portomar/axustes");
  await page.goto(new URL("/admin/portomar/xestion", base).toString());
  await page.getByRole("button", { name: "Nova instalación" }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await assertReflow("Management");
  await audit("management-mobile");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page
    .getByRole("link", { name: "Accesibilidade", exact: true })
    .first()
    .click();
  await page.waitForURL(/\/admin\/[^/]+\/accesibilidade$/);
  await page
    .getByRole("heading", { level: 1, name: "Declaración de accesibilidade" })
    .waitFor();
  await audit("accessibility-admin");
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
    .getByRole("button", { name: "Pistas e espazos: Pavillón municipal" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Nome da pista" })
    .first()
    .waitFor();
  await audit("courts-dialog");
  await page.getByRole("button", { name: "Pechar", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Concello", exact: true })
    .selectOption("vilaverde");
  // Choosing alone does not navigate (WCAG 3.2.2); the button confirms.
  assert.match(page.url(), /\/admin\/portomar\//);
  await page.getByRole("button", { name: "Cambiar", exact: true }).click();
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
  // The deployment operator's area (#18): sign-in, municipalities and their forms, indicators.
  await auditRoute("operator-signed-out", "/admin/operador/concellos");
  await page.getByRole("button", { name: "Entrar como operador/a" }).click();
  await page.getByRole("button", { name: "Novo concello" }).waitFor();
  await page.waitForLoadState("networkidle");
  await audit("operator-municipalities");
  await page.getByRole("button", { name: "Novo concello" }).click();
  await page.getByRole("dialog", { name: "Novo concello" }).waitFor();
  await audit("operator-municipality-form");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Engadir xestor/a" }).first().click();
  await page.getByRole("dialog", { name: "Engadir xestor/a" }).waitFor();
  await audit("operator-manager-form");
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await auditRoute("operator-insights", "/admin/operador/indicadores");
  await auditRoute("operator-web-analytics", "/admin/operador/analitica");
  await page.setViewportSize({ width: 390, height: 844 });
  await assertReflow("Operator web analytics");
  await page.setViewportSize({ width: 1440, height: 1000 });
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(
    `Website → citizen app → admin → operator navigation, role isolation, deep-link reloads, native selects and real booking flow passed. Calendar downloads, subscription revocation, municipal data export, reflow at 320, 390 and 640 px and ${scans.length} WCAG 2.1 A/AA scans passed${Object.keys(knownViolations).length ? " (known violations: see docs/architecture/accessibility.md)" : ""}.`,
  );
} finally {
  await browser.close();
}
