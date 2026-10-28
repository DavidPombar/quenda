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
        version: 2,
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
test("should send only editable fields when a manager saves an existing facility", async () => {
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
  // The public listing carries the courts, which the update endpoint does not accept.
  stubJsonResponse({
    path: "*/v2/public/facilities",
    response: [
      {
        ...facility,
        resources: [
          { id: facility.id, name: "Pista 1", parentId: null, active: true },
        ],
      },
    ],
  });
  const { spy } = stubJsonResponse({
    path: `*/v2/manager/facilities/${facility.id}`,
    method: "PATCH",
    status: 204,
    response: undefined,
  });
  await commands.navigate("/admin/vilaverde/xestion");
  await render(<App />);
  await page.getByRole("button", { name: `Editar ${facility.name}` }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Gardar cambios" })
    .click();
  await expect.poll(() => spy.mock.calls.length).toBe(1);
  const body = (spy.mock.calls[0][0] as { body: Record<string, unknown> }).body;
  expect(body).not.toHaveProperty("resources");
  expect(body).not.toHaveProperty("id");
  expect(body).toMatchObject({ name: facility.name });
});
