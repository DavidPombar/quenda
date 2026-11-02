// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { facility, municipality, stubShell } from "@/test/fixtures";
import type { ManagedActivity, ManagedActivityDetails } from "@/types/models";
const draft: ManagedActivity = {
  id: "60000000-0000-4000-8000-000000000011",
  facilityId: facility.id,
  resourceId: facility.id,
  facilityName: facility.name,
  facilityAddress: facility.address,
  resourceName: "Pista 1",
  sport: "swimming",
  sportName: { gl: "Natación", es: "Natación" },
  sportArt: "swimming",
  name: { gl: "Natación infantil", es: "" },
  description: { gl: "", es: "" },
  rule: {
    weekdays: [2, 4],
    startsLocal: "17:00",
    endsLocal: "18:00",
    startsOn: "2026-11-03",
    endsOn: "2027-06-24",
    exceptions: [],
  },
  places: 8,
  minAge: 6,
  maxAge: 12,
  enrolmentOpensOn: "2026-10-20",
  enrolmentClosesOn: "2026-11-15",
  prices: [{ category: "general", priceCents: 3000 }],
  status: "draft",
  cancellationReason: null,
  nextSession: null,
  upcomingSessions: 0,
  schedule: "BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n",
};
const published: ManagedActivityDetails = {
  ...draft,
  status: "published",
  upcomingSessions: 2,
  nextSession: "2099-11-03T16:00:00Z",
  sessions: [
    {
      id: "61000000-0000-4000-8000-000000000001",
      start: "2099-11-03T16:00:00Z",
      end: "2099-11-03T17:00:00Z",
      status: "active",
      cancellationReason: null,
    },
    {
      id: "61000000-0000-4000-8000-000000000002",
      start: "2099-11-05T16:00:00Z",
      end: "2099-11-05T17:00:00Z",
      status: "active",
      cancellationReason: null,
    },
  ],
};
function stubManager(activities: ManagedActivity[] = []) {
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
    path: "*/v2/manager/activities",
    response: activities,
  });
}
describe("Activities and sports schools", () => {
  test("should save a draft after adding the dates that clash as days without a session", async () => {
    stubManager();
    const clash = stubJsonResponse({
      path: "*/v2/manager/activities",
      method: "POST",
      status: 409,
      response: {
        code: "activity_conflict",
        detail: "",
        clashes: [
          {
            date: "2026-11-05",
            start: "2026-11-05T16:00:00Z",
            end: "2026-11-05T17:00:00Z",
            reason: "booking",
          },
        ],
      },
    });
    await commands.navigate("/admin/vilaverde/actividades");
    await render(<App />);
    await expect
      .element(page.getByText("Aínda non hai actividades."))
      .toBeVisible();
    await page.getByRole("button", { name: "Nova actividade" }).click();
    const form = page.getByRole("form", { name: "Nova actividade" });
    await form
      .getByRole("textbox", { name: "Nome en galego" })
      .fill("Natación infantil");
    await form
      .getByRole("combobox", { name: "Deporte" })
      .selectOptions("swimming");
    await form.getByRole("checkbox", { name: "Martes" }).click();
    await form.getByRole("checkbox", { name: "Xoves" }).click();
    await form
      .getByLabelText("Primeiro día", { exact: false })
      .fill("2026-11-03");
    await form
      .getByLabelText("Último día", { exact: false })
      .fill("2027-06-24");
    await form
      .getByLabelText("Inscrición ata", { exact: false })
      .fill("2026-11-15");
    await form.getByRole("spinbutton", { name: "Prazas" }).fill("8");
    await form.getByRole("spinbutton", { name: "Idade mínima" }).fill("6");
    await form.getByRole("textbox", { name: "Prezo xeral (€)" }).fill("30");
    await form.getByRole("button", { name: "Gardar borrador" }).click();
    const alert = page
      .getByRole("alert")
      .filter({ hasText: "Estas sesións non se poden facer" });
    await expect
      .element(alert.getByText(/17:00–18:00: Hai reservas nesa hora/))
      .toBeVisible();
    expect(clash.spy).toHaveBeenCalledOnce();
    await alert
      .getByRole("button", { name: /como día sen sesión/ })
      .click();
    const saved = stubJsonResponse({
      path: "*/v2/manager/activities",
      method: "POST",
      status: 201,
      response: { ...draft, sessions: [] },
    });
    await form.getByRole("button", { name: "Gardar borrador" }).click();
    await expect.poll(() => saved.spy.mock.calls.length).toBe(1);
    expect(saved.spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          name: { gl: "Natación infantil", es: "" },
          sport: "swimming",
          places: 8,
          minAge: 6,
          maxAge: null,
          prices: [{ category: "general", priceCents: 3000 }],
          rule: expect.objectContaining({
            weekdays: [2, 4],
            startsLocal: "17:00",
            endsLocal: "18:00",
            exceptions: ["2026-11-05"],
          }),
        }),
      }),
    );
  });
  test("should publish a draft and cancel one of its sessions with a reason", async () => {
    stubManager([draft]);
    const publication = stubJsonResponse({
      path: "*/v2/manager/activities/:id/publication",
      method: "POST",
      response: published,
    });
    await commands.navigate(
      `/admin/vilaverde/actividades?actividade=${draft.id}`,
    );
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { name: "Editando: Natación infantil" }))
      .toBeVisible();
    stubJsonResponse({ path: "*/v2/manager/activities", response: [published] });
    stubJsonResponse({
      path: "*/v2/manager/activities/:id",
      response: published,
    });
    await page.getByRole("button", { name: "Publicar" }).click();
    await expect
      .element(page.getByText(/Actividade publicada/))
      .toBeVisible();
    expect(publication.spy).toHaveBeenCalledOnce();
    const cancel = stubJsonResponse({
      path: "*/v2/manager/activity-sessions/:id",
      method: "PATCH",
      status: 204,
      response: undefined,
    });
    await page
      .getByRole("button", { name: /Anular sesión:/ })
      .first()
      .click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Confirmar" }).click();
    await expect
      .element(dialog.getByText(/Escribe o motivo/))
      .toBeVisible();
    await dialog.getByRole("textbox").fill("Avaría na depuradora");
    await dialog.getByRole("button", { name: "Confirmar" }).click();
    await expect.element(dialog).not.toBeInTheDocument();
    expect(cancel.spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { status: "cancelled", reason: "Avaría na depuradora" },
      }),
    );
  });
  test("should ask managers to sign in", async () => {
    stubShell();
    await commands.navigate("/admin/vilaverde/actividades");
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { name: "Actividades", level: 1 }))
      .toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Nova actividade" }))
      .not.toBeInTheDocument();
  });
});
