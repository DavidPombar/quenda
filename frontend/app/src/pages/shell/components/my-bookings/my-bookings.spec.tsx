// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Temporal } from "@js-temporal/polyfill";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import {
  facility,
  municipality,
  pavilion,
  stubAvailability,
  stubShell,
} from "@/test/fixtures";
import type { Booking, Slot } from "@/types/models";
const day = Temporal.Now.plainDateISO(municipality.timezone).add({ days: 2 });
function at(hour: number) {
  return day
    .toZonedDateTime({
      timeZone: municipality.timezone,
      plainTime: Temporal.PlainTime.from({ hour }),
    })
    .toInstant()
    .toString();
}
function slotAt(hour: number, status: Slot["status"] = "available"): Slot {
  return { start: at(hour), end: at(hour + 1), status };
}
const [, , thirdA, thirdB] = pavilion.resources;
const hallBooking: Booking = {
  id: "40000000-0000-4000-8000-000000000001",
  facilityId: pavilion.id,
  facilityName: pavilion.name,
  resourceId: thirdA.id,
  resourceName: thirdA.name,
  sport: "futsal",
  start: at(10),
  end: at(11),
  status: "confirmed",
};
const padelBooking: Booking = {
  ...hallBooking,
  id: "40000000-0000-4000-8000-000000000002",
  facilityId: facility.id,
  facilityName: facility.name,
  resourceId: facility.id,
  resourceName: facility.name,
  sport: "padel",
  start: at(12),
  end: at(13),
};
function stubBookings(bookings: Booking[]) {
  stubJsonResponse({ path: "*/v2/citizen/bookings", response: bookings });
  stubJsonResponse({
    path: "*/v2/citizen/notifications",
    response: [
      {
        id: "50000000-0000-4000-8000-000000000001",
        bookingId: hallBooking.id,
        kind: "confirmed",
        facilityName: pavilion.name,
        resourceId: thirdA.id,
        resourceName: thirdA.name,
        createdAt: "2026-10-18T09:30:00Z",
      },
    ],
  });
}
describe("My bookings with courts", () => {
  test("should name the court only when it differs from the facility", async () => {
    stubShell(true);
    stubBookings([hallBooking, padelBooking]);
    await commands.navigate("/app/vilaverde/reservas");
    await render(<App />);
    const hall = page
      .getByRole("article")
      .filter({ hasText: "Pavillón municipal" });
    await expect
      .element(
        hall.getByRole("heading", { name: "Pavillón municipal", exact: true }),
      )
      .toBeVisible();
    await expect.element(hall).toMatchTextContent(/Pista: Tercio A/);
    const padel = page
      .getByRole("article")
      .filter({ hasText: "Pistas de pádel da Carballeira" });
    await expect.element(padel).toBeVisible();
    await expect.element(padel).not.toMatchTextContent(/Pista:/);
    await expect
      .element(
        page.getByRole("listitem").filter({ hasText: "Reserva confirmada" }),
      )
      .toMatchTextContent(
        /Reserva confirmada.*Pavillón municipal.*Pista: Tercio A/,
      );
    await page
      .getByRole("button", { name: "Cancelar reserva" })
      .first()
      .click();
    await expect
      .element(page.getByRole("dialog"))
      .toMatchTextContent(/Pavillón municipal.*Pista: Tercio A/);
  });
  test("should move a booking to another court of the same facility", async () => {
    stubShell(true);
    stubBookings([hallBooking]);
    stubAvailability(pavilion, (resourceId) =>
      resourceId === thirdA.id
        ? [slotAt(10, "booked"), slotAt(11)]
        : [slotAt(10), slotAt(11, "booked")],
    );
    const patch = stubJsonResponse({
      path: `*/v2/citizen/bookings/${hallBooking.id}`,
      method: "PATCH",
      status: 204,
    });
    await commands.navigate("/app/vilaverde/reservas");
    await render(<App />);
    await page.getByRole("button", { name: "Cambiar quenda" }).click();
    const dialog = page.getByRole("dialog");
    const selector = dialog.getByRole("combobox", { name: "Pista" });
    await expect
      .element(selector)
      .toHaveDisplayValue("Pista completa › Tercio A");
    await expect
      .element(dialog.getByRole("button", { name: "11:00 Libre" }))
      .toBeVisible();
    await selector.selectOptions("Pista completa › Tercio B");
    await expect
      .element(dialog.getByRole("button", { name: "11:00 Libre" }))
      .not.toBeInTheDocument();
    await dialog.getByRole("button", { name: "10:00 Libre" }).click();
    await dialog.getByRole("button", { name: "Confirmar cambio" }).click();
    await expect.element(dialog).not.toBeInTheDocument();
    expect(patch.spy.mock.calls[0][0].body).toEqual({
      start: hallBooking.start,
      resourceId: thirdB.id,
    });
  });
  test("should keep the court out of the change when the facility has one", async () => {
    stubShell(true);
    stubBookings([padelBooking]);
    stubAvailability(facility, () => [slotAt(12, "booked"), slotAt(14)]);
    const patch = stubJsonResponse({
      path: `*/v2/citizen/bookings/${padelBooking.id}`,
      method: "PATCH",
      status: 204,
    });
    await commands.navigate("/app/vilaverde/reservas");
    await render(<App />);
    await page.getByRole("button", { name: "Cambiar quenda" }).click();
    const dialog = page.getByRole("dialog");
    await expect
      .element(dialog.getByRole("combobox", { name: "Pista" }))
      .not.toBeInTheDocument();
    await dialog.getByRole("button", { name: "14:00 Libre" }).click();
    await dialog.getByRole("button", { name: "Confirmar cambio" }).click();
    await expect.element(dialog).not.toBeInTheDocument();
    expect(patch.spy.mock.calls[0][0].body).toEqual({ start: at(14) });
  });
});
