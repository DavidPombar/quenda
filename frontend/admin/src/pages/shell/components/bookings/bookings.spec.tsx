// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { commands, page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { stubShell, municipality, facility } from "@/test/fixtures";
import type { BookingChange, ManagedBooking } from "@/types/models";

const started: ManagedBooking = {
  id: "30000000-0000-4000-8000-000000000001",
  facilityId: facility.id,
  facilityName: facility.name,
  sport: "padel",
  start: "2026-10-27T09:00:00Z",
  end: "2026-10-27T10:00:00Z",
  status: "confirmed",
  outcome: "attended",
  cancelledBy: null,
  cancellationReason: null,
  displayName: "Alex",
  canMarkNoShow: true,
  canRevert: false,
  canCancel: false,
};
const later: ManagedBooking = {
  ...started,
  id: "30000000-0000-4000-8000-000000000002",
  start: "2026-10-27T18:00:00Z",
  end: "2026-10-27T19:00:00Z",
  outcome: "upcoming",
  displayName: "Brais",
  canMarkNoShow: false,
  canCancel: true,
};

function stubManager() {
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
}

describe("day bookings", () => {
  test("should mark a no-show and cancel a later booking with a reason when a manager reviews the day", async () => {
    stubManager();
    let rows = [started, later];
    const changes: { id: string; change: BookingChange }[] = [];
    stubJsonResponse({
      path: "*/v2/manager/bookings",
      response: () => rows,
    });
    stubJsonResponse({
      path: "*/v2/manager/bookings/:id",
      method: "PATCH",
      status: 204,
      response: ({
        body,
        params,
      }: {
        body: unknown;
        params: Record<string, string>;
      }) => {
        const change = body as BookingChange;
        changes.push({ id: params.id, change });
        rows = rows.map((row) =>
          row.id !== params.id
            ? row
            : "attendance" in change
              ? {
                  ...row,
                  status: "no_show",
                  outcome: "no_show",
                  canMarkNoShow: false,
                  canRevert: true,
                }
              : {
                  ...row,
                  status: "cancelled",
                  outcome: "cancelled",
                  cancelledBy: "municipality",
                  cancellationReason: change.reason,
                  canCancel: false,
                },
        );
        return undefined;
      },
    });
    await commands.navigate("/admin/vilaverde/reservas?date=2026-10-27");
    await render(<App />);
    const table = page.getByRole("table", { name: /Reservas do/ });
    await expect
      .element(table.getByRole("rowheader", { name: "Alex" }))
      .toBeVisible();
    await table.getByRole("button", { name: /Non se presentou: Alex/ }).click();
    await expect
      .element(
        page.getByRole("status").getByText(/Marcada como non presentada/),
      )
      .toBeVisible();
    await expect
      .element(
        table.getByRole("button", { name: /Desfacer non presentado: Alex/ }),
      )
      .toBeVisible();
    await expect.element(table.getByText("Non presentada")).toBeVisible();
    await table.getByRole("button", { name: /Cancelar: Brais/ }).click();
    const dialog = page.getByRole("alertdialog");
    await dialog.getByRole("button", { name: "Cancelar e avisar" }).click();
    await expect
      .element(dialog.getByText("Indica o motivo (mínimo 3 caracteres)."))
      .toBeVisible();
    await dialog
      .getByRole("textbox", { name: "Motivo" })
      .fill("Avaría na iluminación");
    await dialog.getByRole("button", { name: "Cancelar e avisar" }).click();
    await expect
      .element(table.getByText("Avaría na iluminación"))
      .toBeVisible();
    await expect
      .element(table.getByText("Cancelada polo concello"))
      .toBeVisible();
    expect(changes).toEqual([
      { id: started.id, change: { attendance: "no_show" } },
      {
        id: later.id,
        change: { status: "cancelled", reason: "Avaría na iluminación" },
      },
    ]);
  });
  test("should ask for a reason and show who is affected when a manager closes a facility with upcoming bookings", async () => {
    stubManager();
    stubJsonResponse({
      path: "*/v2/manager/insights",
      response: {
        total: 0,
        confirmed: 0,
        cancelled: 0,
        noShows: 0,
        occupancy: 0,
        facilities: 1,
        from: "2026-10-27",
        to: "2026-11-02",
        byFacility: [],
      },
    });
    stubJsonResponse({
      path: "*/v2/manager/facilities/:id/impact",
      response: { bookings: 4, people: 3 },
    });
    let saved: Record<string, unknown> | undefined;
    stubJsonResponse({
      path: "*/v2/manager/facilities/:id",
      method: "PATCH",
      status: 204,
      response: ({ body }: { body: unknown }) => {
        saved = body as Record<string, unknown>;
        return undefined;
      },
    });
    await commands.navigate("/admin/vilaverde/xestion");
    await render(<App />);
    await page.getByRole("button", { name: `Editar ${facility.name}` }).click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByRole("combobox", { name: "Estado", exact: true })
      .selectOptions("closed");
    await dialog.getByRole("button", { name: "Gardar cambios" }).click();
    await expect
      .element(
        dialog
          .getByRole("alert")
          .getByText(/Esta instalación ten reservas futuras/),
      )
      .toBeVisible();
    await expect.element(dialog.getByText("4", { exact: true })).toBeVisible();
    await expect.element(dialog.getByText("3", { exact: true })).toBeVisible();
    expect(saved).toBeUndefined();
    await dialog
      .getByRole("textbox", { name: "Motivo" })
      .fill("Obras urxentes na cuberta");
    await dialog
      .getByRole("button", { name: "Pechar e cancelar reservas" })
      .click();
    await expect.element(dialog).not.toBeInTheDocument();
    expect(saved).toMatchObject({
      status: "closed",
      closureReason: "Obras urxentes na cuberta",
    });
  });
});
