// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { facility, stubShell } from "@/test/fixtures";
const slot = {
  start: "2026-10-20T08:00:00Z",
  end: "2026-10-20T09:00:00Z",
  status: "available",
};
test("should show a confirmation when a free slot is reserved", async () => {
  stubShell(true);
  stubJsonResponse({
    path: `*/v2/public/availability/${facility.id}`,
    response: [slot],
  });
  stubJsonResponse({
    path: "*/v2/citizen/bookings",
    method: "POST",
    response: {
      id: "booking-1",
      facilityId: facility.id,
      ...slot,
      status: "confirmed",
    },
    status: 201,
  });
  await commands.navigate(`/app/vilaverde/instalacions/${facility.id}`);
  await render(<App />);
  await page.getByRole("button", { name: "10:00 Libre" }).click();
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect
    .element(
      page.getByRole("heading", { name: "A túa quenda está confirmada!" }),
    )
    .toBeVisible();
});
test("should keep the dialog open with an explanation when another person reserves the slot first", async () => {
  stubShell(true);
  stubJsonResponse({
    path: `*/v2/public/availability/${facility.id}`,
    response: [slot],
  });
  stubJsonResponse({
    path: "*/v2/citizen/bookings",
    method: "POST",
    response: {
      code: "slot_taken",
      detail: "Esta quenda xa está reservada. Escolle outra hora.",
    },
    status: 409,
  });
  await commands.navigate(`/app/vilaverde/instalacions/${facility.id}`);
  await render(<App />);
  await page.getByRole("button", { name: "10:00 Libre" }).click();
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect
    .element(page.getByRole("alert"))
    .toMatchTextContent("Esta quenda xa está reservada.");
  await expect.element(page.getByRole("dialog")).toBeVisible();
});
test("should show the reduced price of a verified category before the person confirms", async () => {
  stubShell(true);
  stubJsonResponse({
    path: `*/v2/public/availability/${facility.id}`,
    response: [slot],
  });
  stubJsonResponse({
    path: `*/v2/citizen/tariffs/${facility.id}`,
    response: { category: "resident", priceCents: 250 },
  });
  await commands.navigate(`/app/vilaverde/instalacions/${facility.id}`);
  await render(<App />);
  await expect
    .element(page.getByRole("heading", { name: "Tarifas" }))
    .toBeVisible();
  await page.getByRole("button", { name: "10:00 Libre" }).click();
  const dialog = page.getByRole("dialog");
  await expect.element(dialog).toMatchTextContent(/2,50\s€/);
  await expect
    .element(dialog)
    .toMatchTextContent("A túa tarifa: Persoa empadroada");
});
test("should show the general price and invite the visitor to sign in for their own tariff", async () => {
  stubShell();
  stubJsonResponse({
    path: `*/v2/public/availability/${facility.id}`,
    response: [slot],
  });
  await commands.navigate(`/app/vilaverde/instalacions/${facility.id}`);
  await render(<App />);
  await page.getByRole("button", { name: "10:00 Libre" }).click();
  const dialog = page.getByRole("dialog");
  await expect.element(dialog).toMatchTextContent(/4,00\s€/);
  await expect
    .element(dialog)
    .toMatchTextContent("verás o teu prezo ao entrar");
});
