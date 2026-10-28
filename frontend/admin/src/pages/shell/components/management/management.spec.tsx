// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell, municipality, facility } from "@/test/fixtures";
import type { Facility } from "@/types/models";

test("should require municipal access when a citizen opens the backoffice", async () => {
  stubShell(true);
  await commands.navigate("/admin/vilaverde/xestion");
  await render(<App />);
  await expect
    .element(
      page.getByRole("heading", {
        name: "Este espazo é para o persoal municipal.",
      }),
    )
    .toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Nova instalación" }))
    .not.toBeInTheDocument();
  await page
    .getByRole("banner")
    .getByRole("button", { name: "Entrar", exact: true })
    .click();
  await expect
    .element(page.getByRole("button", { name: "Entrar como xestor/a" }))
    .toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Entrar como cidadanía" }))
    .not.toBeInTheDocument();
});

test("should save the selected sport, status and duration when a manager creates a facility", async () => {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/session",
    response: {
      session: {
        userId: "manager",
        tenantId: municipality.id,
        displayName: "Uxía",
        role: "manager",
      },
    },
  });
  stubJsonResponse({
    path: "*/v2/manager/insights",
    response: {
      confirmed: 0,
      cancelled: 0,
      occupancy: 0,
      facilities: 1,
      byFacility: [],
    },
  });
  let created: Facility | undefined;
  stubJsonResponse({
    path: "*/v2/public/facilities",
    response: () => (created ? [facility, created] : [facility]),
  });
  stubJsonResponse({
    path: "*/v2/manager/facilities",
    method: "POST",
    status: 201,
    response: ({ body }: { body: unknown }) => {
      created = body as Facility;
      return created;
    },
  });
  await commands.navigate("/admin/vilaverde/xestion");
  await render(<App />);
  await page.getByRole("button", { name: "Nova instalación" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Nome da instalación" })
    .fill("Pista do parque");
  await dialog
    .getByRole("textbox", { name: "Enderezo" })
    .fill("Rúa do Parque, 4");
  await dialog
    .getByRole("combobox", { name: "Deporte", exact: true })
    .selectOptions("tennis");
  await dialog
    .getByRole("combobox", { name: "Estado", exact: true })
    .selectOptions("maintenance");
  await dialog
    .getByRole("combobox", { name: "Duración da quenda (min)" })
    .selectOptions("90");
  await dialog.getByRole("button", { name: "Crear instalación" }).click();
  await expect
    .element(page.getByRole("heading", { name: "Pista do parque" }))
    .toBeVisible();
  await expect.element(page.getByText("90 min", { exact: true })).toBeVisible();
  await expect
    .element(page.getByText("En mantemento", { exact: true }))
    .toBeVisible();
});

test("should download the municipality's open data package when a manager exports it", async () => {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/session",
    response: {
      session: {
        userId: "manager",
        tenantId: municipality.id,
        displayName: "Uxía",
        role: "manager",
      },
    },
  });
  stubJsonResponse({
    path: "*/v2/manager/insights",
    response: {
      confirmed: 0,
      cancelled: 0,
      occupancy: 0,
      facilities: 1,
      byFacility: [],
    },
  });
  stubJsonResponse({ path: "*/v2/public/facilities", response: [facility] });
  let exports = 0;
  stubJsonResponse({
    path: "*/v2/manager/export",
    response: () => {
      exports++;
      return {
        format: "quenda-municipality-export",
        version: 1,
        exportedAt: "2026-10-20T08:00:00Z",
        municipality: { slug: municipality.slug },
      };
    },
  });
  await commands.navigate("/admin/vilaverde/xestion");
  await render(<App />);
  await page.getByRole("button", { name: "Exportar datos" }).click();
  await expect
    .element(
      page
        .getByRole("status")
        .filter({ hasText: "datos completos do concello" }),
    )
    .toBeVisible();
  expect(exports).toBe(1);
});
