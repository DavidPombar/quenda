// SPDX-License-Identifier: AGPL-3.0-or-later
// Screenshots for the technical report (#28), taken from a local stack with the demo data
// (`npm run setup` and `npm run dev`). It signs in with the demo buttons, accepting the demo
// privacy notice, and books one slot tomorrow, so never point it at the shared public demo.
// MEMORIA_APP and MEMORIA_ADMIN point at other local origins.
import fs from "node:fs/promises";
import { chromium } from "playwright";
const base = "http://127.0.0.1:5173";
const app = process.env.MEMORIA_APP ?? base;
const admin = process.env.MEMORIA_ADMIN ?? base;
const out = "docs/memoria/imaxes";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const desktop = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1.5,
  locale: "gl-ES",
});
const page = await desktop.newPage();
/** Viewport screenshot without the sidebar, which every screen shares. */
async function shot(name, clip = { x: 256, y: 0, width: 1024, height: 720 }) {
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${out}/${name}.png`, clip });
}
// Citizen app: a facility's availability for tomorrow, then a booking and the person's list.
await page.goto(`${app}/app/portomar/instalacions`);
await page.getByRole("heading", { name: "Pavillón municipal" }).waitFor();
await page.getByRole("button", { name: "Entrar", exact: true }).click();
await page.getByText("Lin e acepto o aviso de privacidade").click();
await page.getByRole("button", { name: "Entrar como cidadanía" }).click();
await page.getByRole("dialog").waitFor({ state: "hidden" });
await page
  .getByRole("link", { name: "Pistas de pádel da Carballeira", exact: true })
  .click();
await page.getByRole("button", { name: /^Mañá/ }).click();
await page.getByRole("button", { name: /Libre/ }).first().waitFor();
await page.evaluate(() => window.scrollTo(0, 260));
await shot("app-disponibilidade");
await page.getByRole("button", { name: /Libre/ }).first().click();
await page
  .getByRole("button", { name: "Confirmar reserva", exact: true })
  .click();
await page
  .getByRole("heading", { name: "A túa quenda está confirmada!" })
  .waitFor();
await page.goto(`${app}/app/portomar/reservas`);
await page.getByRole("button", { name: "Mostrar QR" }).first().waitFor();
await shot("app-reservas");
// Backoffice: facilities and tomorrow's bookings.
await page.goto(`${admin}/admin/portomar/xestion`);
await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
await page.getByRole("button", { name: "Entrar como xestor/a" }).click();
await page.getByRole("dialog").waitFor({ state: "hidden" });
await page.getByRole("button", { name: "Nova instalación" }).waitFor();
await shot("admin-instalacions");
await page.goto(`${admin}/admin/portomar/reservas`);
await page.locator("main h1").first().waitFor();
const tomorrow = await page.evaluate(() =>
  new Date(Date.now() + 86_400_000).toLocaleDateString("sv-SE"),
);
await page.getByLabel("Día", { exact: true }).fill(tomorrow);
await page.getByText("Non hai reservas este día").waitFor({ state: "hidden" });
await page.evaluate(() => document.activeElement?.blur());
await shot("admin-reservas");
// The citizen app on a phone.
const phone = await browser.newContext({
  viewport: { width: 390, height: 780 },
  deviceScaleFactor: 2,
  locale: "gl-ES",
});
const mobile = await phone.newPage();
await mobile.goto(`${app}/app/portomar/instalacions`);
await mobile.getByRole("heading", { name: "Pavillón municipal" }).waitFor();
await mobile.waitForLoadState("networkidle");
await mobile.screenshot({ path: `${out}/app-movil.png` });
await browser.close();
