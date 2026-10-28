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
import type {
  Booking,
  Notification,
  PenaltyStanding,
  Slot,
} from "@/types/models";
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
  outcome: "upcoming",
  cancelledBy: null,
  cancellationReason: null,
  tariffCategory: null,
  priceCents: null,
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
    path: "*/v2/citizen/calendar-feed",
    response: { active: false, createdAt: null },
  });
  stubJsonResponse({
    path: "*/v2/citizen/penalty",
    response: {
      enabled: true,
      count: 0,
      limit: 3,
      windowDays: 30,
      blockDays: 7,
      remaining: 3,
      blockedUntil: null,
    },
  });
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
const absence: Booking = {
  id: "30000000-0000-4000-8000-000000000001",
  facilityId: facility.id,
  facilityName: facility.name,
  resourceId: facility.id,
  resourceName: facility.name,
  sport: "padel",
  start: "2026-10-20T08:00:00Z",
  end: "2026-10-20T09:00:00Z",
  status: "no_show",
  outcome: "no_show",
  cancelledBy: null,
  cancellationReason: null,
  tariffCategory: null,
  priceCents: null,
};
const closed: Booking = {
  ...absence,
  id: "30000000-0000-4000-8000-000000000002",
  start: "2026-10-18T08:00:00Z",
  end: "2026-10-18T09:00:00Z",
  status: "cancelled",
  outcome: "cancelled",
  cancelledBy: "municipality",
  cancellationReason: "Obras urxentes na cuberta",
};
const standing: PenaltyStanding = {
  enabled: true,
  count: 3,
  limit: 3,
  windowDays: 30,
  blockDays: 7,
  remaining: 0,
  blockedUntil: "2026-10-27T10:00:00Z",
};
const notices: Notification[] = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    bookingId: absence.id,
    kind: "blocked",
    facilityName: facility.name,
    resourceId: facility.id,
    resourceName: facility.name,
    createdAt: "2026-10-20T10:00:00Z",
    details: { standing },
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    bookingId: closed.id,
    kind: "cancelled_by_municipality",
    facilityName: facility.name,
    resourceId: facility.id,
    resourceName: facility.name,
    createdAt: "2026-10-17T10:00:00Z",
    details: { reason: "Obras urxentes na cuberta" },
  },
];
test("should explain no-shows, municipal cancellations and an active booking block in the person's history", async () => {
  stubShell(true);
  stubJsonResponse({
    path: "*/v2/citizen/calendar-feed",
    response: { active: false, createdAt: null },
  });
  stubJsonResponse({
    path: "*/v2/citizen/bookings",
    response: [absence, closed],
  });
  stubJsonResponse({ path: "*/v2/citizen/notifications", response: notices });
  stubJsonResponse({ path: "*/v2/citizen/penalty", response: standing });
  await commands.navigate("/app/vilaverde/reservas");
  await render(<App />);
  await expect
    .element(page.getByRole("alert"))
    .toHaveTextContent(
      "Por acumular ausencias sen avisar, non podes facer reservas ata o 27 de outubro de 2026.",
    );
  await page.getByRole("button", { name: "Historial" }).click();
  await expect
    .element(page.getByText("Non presentada", { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText("Cancelada polo concello", { exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByText("Motivo: Obras urxentes na cuberta"))
    .toBeVisible();
  const panel = page.getByRole("complementary");
  await expect
    .element(panel.getByText("Reservas bloqueadas temporalmente"))
    .toBeVisible();
  await expect
    .element(panel.getByText("O concello cancelou a túa reserva"))
    .toBeVisible();
  await expect
    .element(panel.getByText("Obras urxentes na cuberta", { exact: true }))
    .toBeVisible();
});
test("should tell the person how many more absences the municipality allows before a block", async () => {
  stubShell(true);
  stubJsonResponse({
    path: "*/v2/citizen/calendar-feed",
    response: { active: false, createdAt: null },
  });
  stubJsonResponse({ path: "*/v2/citizen/bookings", response: [] });
  stubJsonResponse({ path: "*/v2/citizen/notifications", response: [] });
  stubJsonResponse({
    path: "*/v2/citizen/penalty",
    response: { ...standing, count: 2, remaining: 1, blockedUntil: null },
  });
  await commands.navigate("/app/vilaverde/reservas");
  await render(<App />);
  await expect
    .element(page.getByRole("status"))
    .toHaveTextContent(
      "Levas 2 ausencias sen avisar nos últimos 30 días. Se faltas 1 vez máis, non poderás reservar durante 7 días.",
    );
});
test("should list a booking reminder among the notices", async () => {
  stubShell(true);
  stubJsonResponse({
    path: "*/v2/citizen/calendar-feed",
    response: { active: false, createdAt: null },
  });
  stubJsonResponse({ path: "*/v2/citizen/bookings", response: [] });
  stubJsonResponse({
    path: "*/v2/citizen/notifications",
    response: [
      {
        id: "40000000-0000-4000-8000-000000000003",
        bookingId: absence.id,
        kind: "reminder",
        facilityName: facility.name,
        resourceId: facility.id,
        resourceName: facility.name,
        createdAt: "2026-10-20T08:00:00Z",
        details: null,
      },
    ] satisfies Notification[],
  });
  stubJsonResponse({
    path: "*/v2/citizen/penalty",
    response: { ...standing, count: 0, remaining: 3, blockedUntil: null },
  });
  await commands.navigate("/app/vilaverde/reservas");
  await render(<App />);
  await expect
    .element(page.getByText("Lembranza da reserva", { exact: true }))
    .toBeVisible();
});

const booking = {
  id: "30000000-0000-4000-8000-000000000001",
  facilityId: facility.id,
  facilityName: facility.name,
  sport: facility.sport,
  start: "2099-10-20T08:00:00Z",
  end: "2099-10-20T09:00:00Z",
  status: "confirmed",
  outcome: "upcoming",
  cancelledBy: null,
  cancellationReason: null,
  tariffCategory: null,
  priceCents: null,
};
const token = "a".repeat(64);
function stubCalendarBookings(feed: {
  active: boolean;
  createdAt: string | null;
}) {
  stubShell(true);
  stubJsonResponse({
    path: "*/v2/citizen/calendar-feed",
    response: { active: false, createdAt: null },
  });
  stubJsonResponse({ path: "*/v2/citizen/bookings", response: [booking] });
  stubJsonResponse({ path: "*/v2/citizen/notifications", response: [] });
  stubJsonResponse({ path: "*/v2/citizen/calendar-feed", response: feed });
  stubJsonResponse({
    path: "*/v2/citizen/penalty",
    response: { ...standing, count: 0, blockedUntil: null },
  });
}
test("should offer each confirmed reservation as an iCalendar download", async () => {
  stubCalendarBookings({ active: false, createdAt: null });
  await commands.navigate("/app/vilaverde/reservas");
  await render(<App />);
  await expect
    .element(page.getByRole("link", { name: "Engadir ao calendario" }))
    .toHaveAttribute("href", `/v2/citizen/bookings/${booking.id}/calendar.ics`);
});
test("should show the subscription link once when a person creates it", async () => {
  stubCalendarBookings({ active: false, createdAt: null });
  stubJsonResponse({
    path: "*/v2/citizen/calendar-feed",
    method: "POST",
    status: 201,
    response: {
      path: `/v2/public/calendar-feeds/${token}.ics`,
      createdAt: "2026-10-20T08:00:00Z",
    },
  });
  await commands.navigate("/app/vilaverde/reservas");
  await render(<App />);
  await page
    .getByRole("button", { name: "Crear ligazón de subscrición" })
    .click();
  await expect
    .element(page.getByRole("textbox", { name: "Ligazón de subscrición" }))
    .toHaveValue(
      `${window.location.origin}/v2/public/calendar-feeds/${token}.ics`,
    );
  await expect
    .element(page.getByRole("link", { name: "Abrir na app de calendario" }))
    .toHaveAttribute(
      "href",
      `webcal://${window.location.host}/v2/public/calendar-feeds/${token}.ics`,
    );
});
test("should let a person revoke an active subscription link", async () => {
  stubCalendarBookings({ active: true, createdAt: "2026-10-18T08:00:00Z" });
  await commands.navigate("/app/vilaverde/reservas");
  await render(<App />);
  await expect
    .element(page.getByText(/Tes unha ligazón activa desde o/))
    .toBeVisible();
  stubJsonResponse({
    path: "*/v2/citizen/calendar-feed",
    method: "DELETE",
    status: 204,
    response: null,
  });
  stubJsonResponse({
    path: "*/v2/citizen/calendar-feed",
    response: { active: false, createdAt: null },
  });
  await page.getByRole("button", { name: "Revogar ligazón" }).click();
  await expect
    .element(page.getByRole("button", { name: "Crear ligazón de subscrición" }))
    .toBeVisible();
});
