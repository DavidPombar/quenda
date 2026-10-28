// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell, municipality } from "@/test/fixtures";
const citizenId = "10000000-0000-4000-8000-000000000011";
function stubManager() {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/municipalities",
    response: [{ ...municipality, enabledCategories: ["resident", "minor"] }],
  });
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
}
function stubDecision() {
  return stubJsonResponse({
    path: `*/v2/manager/citizens/${citizenId}/categories/*`,
    method: "PUT",
    response: ({ body }: { body: unknown }) => ({
      category: "resident",
      status: (body as { status: string }).status,
      requestedAt: null,
      decidedAt: "2026-10-27T10:00:00Z",
    }),
  });
}
async function open() {
  await commands.navigate("/admin/vilaverde/categorias");
  await render(<App />);
  await expect
    .element(
      page.getByRole("heading", { level: 1, name: "Categorías e tarifas" }),
    )
    .toBeVisible();
}
describe("user categories", () => {
  test("should verify a pending residency request", async () => {
    stubManager();
    stubJsonResponse({
      path: "*/v2/manager/category-requests",
      response: [
        {
          userId: citizenId,
          displayName: "Alex",
          category: "resident",
          requestedAt: "2026-10-20T09:00:00Z",
        },
      ],
    });
    const { spy } = stubDecision();
    await open();
    await page
      .getByRole("button", { name: "Verificar: Alex · Persoa empadroada" })
      .click();
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("Categoría actualizada.");
    expect(spy.mock.calls.at(-1)![0].body).toEqual({ status: "verified" });
  });
  test("should assign a category directly to a citizen found by name", async () => {
    stubManager();
    stubJsonResponse({
      path: "*/v2/manager/category-requests",
      response: [],
    });
    stubJsonResponse({
      path: "*/v2/manager/citizens",
      response: [{ userId: citizenId, displayName: "Alex", categories: [] }],
    });
    const { spy } = stubDecision();
    await open();
    await expect
      .element(page.getByText("Non hai solicitudes pendentes."))
      .toBeVisible();
    await page.getByRole("searchbox", { name: "Buscar persoa" }).fill("Ale");
    await page.getByRole("button", { name: "Buscar", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Categorías: Alex" })
      .selectOptions("Menor de idade");
    await page.getByRole("button", { name: "Asignar: Alex" }).click();
    await expect
      .element(page.getByRole("status"))
      .toHaveTextContent("Categoría actualizada.");
    expect(spy.mock.calls.at(-1)![0]).toMatchObject({
      body: { status: "verified" },
    });
  });
});
