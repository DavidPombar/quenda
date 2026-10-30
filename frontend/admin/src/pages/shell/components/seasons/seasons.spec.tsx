// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { facility, municipality, stubShell } from "@/test/fixtures";
import type { Campaign, Organization, SeasonAllocation } from "@/types/models";
const club: Organization = {
  id: "50000000-0000-4000-8000-000000000011",
  name: "Club Pádel Vilaverde",
  taxId: "G15000001",
  sport: "padel",
  contactEmail: "padel@vilaverde.example",
  createdAt: "2026-08-20T09:00:00Z",
  archivedAt: null,
  representatives: [],
};
const campaign: Campaign = {
  id: "51000000-0000-4000-8000-000000000011",
  name: "Curso 2026–2027",
  startsOn: "2026-09-01",
  endsOn: "2027-06-30",
  criteria: { gl: "Clubs con sede no concello", es: "Clubes con sede" },
  facilityIds: [facility.id],
};
const allocation: SeasonAllocation = {
  id: "52000000-0000-4000-8000-000000000011",
  campaignId: campaign.id,
  organizationId: club.id,
  organizationName: club.name,
  facilityId: facility.id,
  facilityName: facility.name,
  resourceId: facility.id,
  resourceName: "Pista 1",
  weekdays: [2, 4],
  startsLocal: "19:00",
  endsLocal: "21:00",
  reason: "Escola de menores",
  createdAt: "2026-08-25T09:00:00Z",
  cancelledAt: null,
  cancellationReason: null,
  active: 68,
  cancelled: 0,
  conflicts: [
    {
      occurrenceId: "53000000-0000-4000-8000-000000000001",
      start: "2026-11-05T18:00:00Z",
      end: "2026-11-05T20:00:00Z",
      bookingId: "40000000-0000-4000-8000-000000000001",
    },
  ],
  dates: [
    {
      id: "53000000-0000-4000-8000-000000000002",
      start: "2026-11-10T18:00:00Z",
      end: "2026-11-10T20:00:00Z",
    },
  ],
};
function stubManager(
  options: {
    organizations?: Organization[];
    campaigns?: Campaign[];
    allocations?: SeasonAllocation[];
  } = {},
) {
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
    path: "*/v2/manager/organizations",
    response: options.organizations ?? [club],
  });
  stubJsonResponse({
    path: "*/v2/manager/season-campaigns",
    response: options.campaigns ?? [campaign],
  });
  stubJsonResponse({
    path: "*/v2/manager/season-allocations",
    response: options.allocations ?? [],
  });
}
describe("Season allocation to clubs", () => {
  test("should register a club and link a representative by email", async () => {
    stubManager({ campaigns: [] });
    const created = stubJsonResponse({
      path: "*/v2/manager/organizations",
      method: "POST",
      status: 201,
      response: { id: "new" },
    });
    const linked = stubJsonResponse({
      path: "*/v2/manager/organizations/:id/representatives",
      method: "POST",
      status: 404,
      response: { code: "not_found", detail: "" },
    });
    await commands.navigate("/admin/vilaverde/temporadas");
    await render(<App />);
    const form = page.getByRole("form", { name: "Rexistrar o club" });
    await form
      .getByRole("textbox", { name: "Nome" })
      .fill("Escola de Natación");
    await form
      .getByRole("combobox", { name: "Deporte principal" })
      .selectOptions("swimming");
    await form.getByRole("button", { name: "Rexistrar o club" }).click();
    await expect.element(page.getByText("Club rexistrado.")).toBeVisible();
    expect(created.spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          name: "Escola de Natación",
          sport: "swimming",
        }),
      }),
    );
    const add = page.getByRole("form", {
      name: `Engadir representante: ${club.name}`,
    });
    await add
      .getByRole("textbox", { name: "Correo da conta cidadá" })
      .fill("ninguen@vilaverde.example");
    await add.getByRole("button", { name: "Engadir representante" }).click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent(
        "Non hai ningunha conta cidadá con ese correo neste concello.",
      );
    expect(linked.spy).toHaveBeenCalledOnce();
  });
  test("should open a campaign with its facilities and published criteria", async () => {
    stubManager({ campaigns: [] });
    const { spy } = stubJsonResponse({
      path: "*/v2/manager/season-campaigns",
      method: "POST",
      status: 201,
      response: { id: campaign.id },
    });
    await commands.navigate("/admin/vilaverde/temporadas");
    await render(<App />);
    const form = page.getByRole("form", { name: "Abrir a campaña" });
    await form
      .getByRole("textbox", { name: "Nome da campaña" })
      .fill("Verán 2027");
    await form
      .getByLabelText("Primeiro día", { exact: false })
      .fill("2027-07-01");
    await form
      .getByLabelText("Último día", { exact: false })
      .fill("2027-08-31");
    await form.getByRole("checkbox", { name: facility.name }).click();
    await form
      .getByRole("textbox", { name: "Criterios de prioridade (galego)" })
      .fill("Campamentos municipais primeiro");
    await form.getByRole("button", { name: "Abrir a campaña" }).click();
    await expect.element(page.getByText("Campaña aberta.")).toBeVisible();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          name: "Verán 2027",
          startsOn: "2027-07-01",
          endsOn: "2027-08-31",
          facilityIds: [facility.id],
          criteria: { gl: "Campamentos municipais primeiro", es: "" },
        }),
      }),
    );
  });
  test("should assign a weekly slot and list the dates kept by one-off bookings", async () => {
    stubManager();
    const { spy } = stubJsonResponse({
      path: "*/v2/manager/season-allocations",
      method: "POST",
      status: 201,
      response: { allocation, created: 68, conflicts: allocation.conflicts },
    });
    await commands.navigate("/admin/vilaverde/temporadas");
    await render(<App />);
    const form = page.getByRole("form", { name: "Asignar a franxa" });
    await form.getByRole("checkbox", { name: "Martes" }).click();
    await form.getByRole("checkbox", { name: "Xoves" }).click();
    await form
      .getByRole("textbox", { name: "Motivo da asignación" })
      .fill("Escola de menores");
    await form.getByRole("button", { name: "Asignar a franxa" }).click();
    await expect
      .element(page.getByText("68 datas asignadas, 1 en conflito."))
      .toBeVisible();
    await expect
      .element(page.getByText(/reserva puntual/).first())
      .toBeVisible();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          campaignId: campaign.id,
          organizationId: club.id,
          facilityId: facility.id,
          resourceId: facility.id,
          weekdays: [2, 4],
          startsLocal: "19:00",
          endsLocal: "21:00",
          reason: "Escola de menores",
        },
      }),
    );
  });
  test("should free one date of a club's slot only after a reason is given", async () => {
    stubManager({ allocations: [allocation] });
    const { spy } = stubJsonResponse({
      path: "*/v2/manager/season-occurrences/:id",
      method: "PATCH",
      response: {},
    });
    await commands.navigate("/admin/vilaverde/temporadas");
    await render(<App />);
    await page.getByRole("button", { name: "Liberar unha data" }).click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Confirmar" }).click();
    await expect
      .element(
        dialog.getByText("Escribe o motivo: queda no rexistro de auditoría."),
      )
      .toBeVisible();
    expect(spy).not.toHaveBeenCalled();
    await dialog
      .getByRole("textbox", { name: "Motivo" })
      .fill("Torneo municipal");
    await dialog.getByRole("button", { name: "Confirmar" }).click();
    await expect.element(dialog).not.toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.stringContaining(allocation.dates[0].id),
        body: { status: "cancelled", reason: "Torneo municipal" },
      }),
    );
  });
});
