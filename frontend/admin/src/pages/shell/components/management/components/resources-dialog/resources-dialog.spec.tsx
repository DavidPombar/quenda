// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell, municipality, facility } from "@/test/fixtures";
import type { Facility, ResourceDraft } from "@/types/models";
const hall: Facility = {
  ...facility,
  resources: [
    {
      id: facility.id,
      name: "Pista completa",
      parentId: null,
      active: true,
      position: 0,
    },
  ],
};
function stubManager(facilities: Facility[]) {
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
  stubJsonResponse({ path: "*/v2/manager/facilities", response: facilities });
}
async function open() {
  await commands.navigate("/admin/vilaverde/xestion");
  await render(<App />);
  await page
    .getByRole("button", { name: `Pistas e espazos: ${facility.name}` })
    .click();
  return page.getByRole("dialog");
}
describe("Courts and spaces of a facility", () => {
  test("should split a court into parts and save the whole set in order", async () => {
    stubManager([hall]);
    const { spy } = stubJsonResponse({
      path: `*/v2/manager/facilities/${facility.id}/resources`,
      method: "PUT",
      response: ({ body }: { body: unknown }) =>
        (body as { resources: ResourceDraft[] }).resources.map(
          (item, position) => ({
            ...item,
            position,
          }),
        ),
    });
    const dialog = await open();
    for (const name of ["Tercio A", "Tercio B"]) {
      await dialog.getByRole("button", { name: "Engadir pista" }).click();
      await dialog
        .getByRole("textbox", { name: "Nome da pista" })
        .last()
        .fill(name);
      await dialog
        .getByRole("combobox", { name: "Parte de" })
        .last()
        .selectOptions("Pista completa");
    }
    // A whole court with parts cannot itself become a part.
    await expect.element(dialog.getByText("Ten partes")).toBeVisible();
    expect(
      dialog.getByRole("combobox", { name: "Parte de" }).elements(),
    ).toHaveLength(2);
    await dialog.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(page.getByRole("status"))
      .toMatchTextContent("Pistas gardadas.");
    const { resources } = (
      spy.mock.calls[0][0] as { body: { resources: ResourceDraft[] } }
    ).body;
    expect(resources.map((item) => [item.name, item.parentId])).toEqual([
      ["Pista completa", null],
      ["Tercio A", facility.id],
      ["Tercio B", facility.id],
    ]);
  });
  test("should ask for distinct names before sending anything", async () => {
    stubManager([hall]);
    const { spy } = stubJsonResponse({
      path: `*/v2/manager/facilities/${facility.id}/resources`,
      method: "PUT",
      response: [],
    });
    const dialog = await open();
    await dialog.getByRole("button", { name: "Engadir pista" }).click();
    await dialog
      .getByRole("textbox", { name: "Nome da pista" })
      .last()
      .fill("pista completa");
    await dialog.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(dialog.getByRole("alert"))
      .toMatchTextContent("Escribe un nome distinto para cada pista.");
    expect(spy).not.toHaveBeenCalled();
  });
  test("should keep the dialog open with the reason when a court is in use", async () => {
    stubManager([
      {
        ...hall,
        resources: [
          ...hall.resources!,
          {
            id: "part-a",
            name: "Tercio A",
            parentId: facility.id,
            active: true,
            position: 1,
          },
        ],
      },
    ]);
    stubJsonResponse({
      path: `*/v2/manager/facilities/${facility.id}/resources`,
      method: "PUT",
      status: 409,
      response: {
        code: "resource_in_use",
        detail: "Unha pista con reservas pendentes non se pode quitar.",
      },
    });
    const dialog = await open();
    await expect.element(page.getByText("2 pistas")).toBeInTheDocument();
    await dialog.getByRole("button", { name: "Quitar: Tercio A" }).click();
    await dialog.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(dialog.getByRole("alert"))
      .toMatchTextContent(
        "Unha pista con reservas pendentes non se pode quitar.",
      );
    await expect.element(dialog).toBeVisible();
  });
});
