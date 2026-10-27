// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { municipality, stubShell } from "@/test/fixtures";
import type { AccessDay } from "@/types/models";
const booking = {
  id: "50000000-0000-4000-8000-000000000001",
  code: "50000000",
  facilityId: "20000000-0000-4000-8000-000000000011",
  facilityName: "Pistas de pádel da Carballeira",
  start: "2030-03-17T10:00:00Z",
  end: "2030-03-17T11:00:00Z",
  status: "confirmed" as const,
  holder: "Alex",
  checkedInAt: null,
};
const day: AccessDay = {
  date: "2030-03-17",
  syncedAt: "2030-03-17T08:00:00Z",
  issuer: municipality.slug,
  keys: [],
  bookings: [booking],
  revoked: [],
};
function stubAccessStaff() {
  stubShell();
  stubJsonResponse({
    path: "*/v2/public/session",
    response: {
      session: {
        userId: "access",
        tenantId: municipality.id,
        displayName: "Brais · control de accesos",
        role: "access",
      },
    },
  });
}
describe("Access control at the door", () => {
  test("should take access staff to the door and hide the management areas", async () => {
    stubAccessStaff();
    stubJsonResponse({ path: "*/v2/access/day", response: day });
    await commands.navigate("/admin/vilaverde/xestion");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", { level: 1, name: "Control de accesos" }),
      )
      .toBeVisible();
    const nav = page.getByRole("navigation", { name: "Área do concello" });
    await expect
      .element(nav.getByRole("link", { name: "Control de accesos" }))
      .toBeVisible();
    await expect
      .element(nav.getByRole("link", { name: "Axustes" }))
      .not.toBeInTheDocument();
    await expect
      .element(nav.getByRole("link", { name: "Auditoría" }))
      .not.toBeInTheDocument();
  });
  test("should record a manual entry from the day's list", async () => {
    stubAccessStaff();
    // Like the server, the day reflects the entry once it has been recorded.
    let recordedAt: string | null = null;
    stubJsonResponse({
      path: "*/v2/access/day",
      response: () => ({
        ...day,
        bookings: [{ ...booking, checkedInAt: recordedAt }],
      }),
    });
    const { spy } = stubJsonResponse({
      path: "*/v2/access/check-ins",
      method: "POST",
      response: () => {
        recordedAt = "2030-03-17T10:05:00Z";
        return { results: [{ bookingId: booking.id, outcome: "recorded" }] };
      },
    });
    await commands.navigate("/admin/vilaverde/acceso");
    await render(<App />);
    await page
      .getByRole("button", { name: `Rexistrar entrada: ${booking.code}` })
      .click();
    await expect.element(page.getByText("Entrou ás 11:05")).toBeVisible();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          items: [
            expect.objectContaining({
              bookingId: booking.id,
              method: "manual",
            }),
          ],
        },
      }),
    );
  });
  test("should keep entries made offline and send them on the next sync", async () => {
    stubAccessStaff();
    localStorage.setItem(
      `quenda.access.${municipality.slug}.day`,
      JSON.stringify(day),
    );
    // No network until the device syncs again.
    stubJsonResponse({
      path: "*/v2/access/day",
      status: 503,
      response: { code: "unavailable", detail: "" },
    });
    const offline = stubJsonResponse({
      path: "*/v2/access/check-ins",
      method: "POST",
      status: 503,
      response: { code: "unavailable", detail: "" },
    });
    await commands.navigate("/admin/vilaverde/acceso");
    await render(<App />);
    await expect
      .element(page.getByText(/Sen conexión: usando a sincronización/))
      .toBeVisible();
    await page
      .getByRole("button", { name: `Rexistrar entrada: ${booking.code}` })
      .click();
    await expect
      .element(page.getByText(/1 entradas pendentes de enviar/))
      .toBeVisible();
    stubJsonResponse({
      path: "*/v2/access/day",
      response: { ...day, syncedAt: "2030-03-17T09:00:00Z" },
    });
    const online = stubJsonResponse({
      path: "*/v2/access/check-ins",
      method: "POST",
      response: { results: [{ bookingId: booking.id, outcome: "cancelled" }] },
    });
    await page.getByRole("button", { name: "Sincronizar" }).click();
    await expect
      .element(page.getByRole("alert"))
      .toHaveTextContent(
        `Non se puido rexistrar a entrada de ${booking.code}: a reserva foi cancelada.`,
      );
    await expect
      .element(page.getByText(/entradas pendentes de enviar/))
      .not.toBeInTheDocument();
    expect(offline.spy).toHaveBeenCalledTimes(1);
    expect(online.spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { items: [expect.objectContaining({ bookingId: booking.id })] },
      }),
    );
  });
});
