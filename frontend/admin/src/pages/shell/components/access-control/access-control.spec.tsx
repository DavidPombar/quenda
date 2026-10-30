// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { http, HttpResponse } from "msw";
import {
  serverManager,
  stubJsonResponse,
} from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { municipality, stubShell } from "@/test/fixtures";
import type { AccessDay } from "@/types/models";
const booking = {
  id: "50000000-0000-4000-8000-000000000001",
  code: "50000000",
  sequence: 0,
  validFrom: Temporal.Now.instant().subtract({ hours: 1 }).toString(),
  facilityId: "20000000-0000-4000-8000-000000000011",
  facilityName: "Pistas de pádel da Carballeira",
  start: Temporal.Now.instant().subtract({ minutes: 1 }).toString(),
  end: Temporal.Now.instant().add({ hours: 1 }).toString(),
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
    // Whether the device tries to send while still offline depends on timing; what matters is that
    // the entry is kept and sent once the connection is back.
    expect(offline.spy.mock.calls.length).toBeLessThanOrEqual(1);
    expect(online.spy).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { items: [expect.objectContaining({ bookingId: booking.id })] },
      }),
    );
  });
  test("should refuse cached door data when the session is rejected", async () => {
    stubAccessStaff();
    localStorage.setItem(
      `quenda.access.${municipality.slug}.day`,
      JSON.stringify(day),
    );
    stubJsonResponse({
      path: "*/v2/access/day",
      status: 403,
      response: { code: "forbidden", detail: "Forbidden" },
    });
    await commands.navigate("/admin/vilaverde/acceso");
    await render(<App />);
    await expect
      .element(page.getByRole("button", { name: "Sincronizar" }))
      .toBeVisible();
    await expect
      .element(
        page.getByRole("button", {
          name: `Rexistrar entrada: ${booking.code}`,
        }),
      )
      .not.toBeInTheDocument();
    await expect
      .element(page.getByText(/Sen conexión: usando a sincronización/))
      .not.toBeInTheDocument();
  });
  test("should keep a newer entry while an earlier batch is still being sent", async () => {
    stubAccessStaff();
    const second = {
      ...booking,
      id: "50000000-0000-4000-8000-000000000002",
      code: "SECOND",
    };
    const entered = new Set<string>();
    let release!: () => void;
    const firstDelivery = new Promise<void>((resolve) => {
      release = resolve;
    });
    let calls = 0;
    stubJsonResponse({
      path: "*/v2/access/day",
      response: () => ({
        ...day,
        bookings: [booking, second].map((b) => ({
          ...b,
          checkedInAt: entered.has(b.id) ? "2030-03-17T10:05:00Z" : null,
        })),
      }),
    });
    const deliveries: unknown[] = [];
    serverManager.getServer().use(
      http.post("*/v2/access/check-ins", async ({ request }) => {
        deliveries.push(await request.json());
        const first = ++calls === 1;
        if (first) await firstDelivery;
        const id = first ? booking.id : second.id;
        entered.add(id);
        return HttpResponse.json({
          results: [{ bookingId: id, outcome: "recorded" }],
        });
      }),
    );
    await commands.navigate("/admin/vilaverde/acceso");
    await render(<App />);
    await page
      .getByRole("button", { name: `Rexistrar entrada: ${booking.code}` })
      .click();
    await page
      .getByRole("button", { name: "Rexistrar entrada: SECOND" })
      .click();
    await expect
      .element(page.getByText(/2 entradas pendentes de enviar/))
      .toBeVisible();
    release();
    await expect
      .element(page.getByText(/entradas pendentes de enviar/))
      .not.toBeInTheDocument();
    expect(deliveries).toHaveLength(2);
    expect(deliveries[1]).toEqual({
      items: [expect.objectContaining({ bookingId: second.id, sequence: 0 })],
    });
  });
});
