// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { facility, stubShell } from "@/test/fixtures";
import type { Booking, Notification, PenaltyStanding } from "@/types/models";
const base: Booking = {
  id: "30000000-0000-4000-8000-000000000001",
  facilityId: facility.id,
  facilityName: facility.name,
  sport: "padel",
  start: "2026-10-20T08:00:00Z",
  end: "2026-10-20T09:00:00Z",
  status: "no_show",
  outcome: "no_show",
  cancelledBy: null,
  cancellationReason: null,
};
const closed: Booking = {
  ...base,
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
    bookingId: base.id,
    kind: "blocked",
    facilityName: facility.name,
    createdAt: "2026-10-20T10:00:00Z",
    details: { standing },
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    bookingId: closed.id,
    kind: "cancelled_by_municipality",
    facilityName: facility.name,
    createdAt: "2026-10-17T10:00:00Z",
    details: { reason: "Obras urxentes na cuberta" },
  },
];
test("should explain no-shows, municipal cancellations and an active booking block in the person's history", async () => {
  stubShell(true);
  stubJsonResponse({ path: "*/v2/citizen/bookings", response: [base, closed] });
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
test("should show the signed access QR of an upcoming booking with its validity window", async () => {
  const upcoming: Booking = {
    ...base,
    id: "30000000-0000-4000-8000-000000000003",
    start: "2026-10-30T17:00:00Z",
    end: "2026-10-30T18:00:00Z",
    status: "confirmed",
    outcome: "upcoming",
  };
  stubShell(true);
  stubJsonResponse({ path: "*/v2/citizen/bookings", response: [upcoming] });
  stubJsonResponse({ path: "*/v2/citizen/notifications", response: [] });
  stubJsonResponse({
    path: "*/v2/citizen/penalty",
    response: { ...standing, count: 0, remaining: 3, blockedUntil: null },
  });
  stubJsonResponse({
    path: `*/v2/citizen/bookings/${upcoming.id}/credential`,
    response: {
      token: "eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ4In0.c2lnbmF0dXJl",
      keyId: "50000000-0000-4000-8000-000000000001",
      notBefore: "2026-10-30T08:00:00Z",
      expiresAt: "2026-10-30T18:00:00Z",
    },
  });
  await commands.navigate("/app/vilaverde/reservas");
  await render(<App />);
  await page.getByRole("button", { name: "Código de acceso" }).click();
  const dialog = page.getByRole("dialog", { name: "O teu código de acceso" });
  await expect
    .element(
      dialog.getByRole("img", { name: "Código QR de acceso á instalación" }),
    )
    .toBeVisible();
  await expect
    .element(dialog.getByText("desde as 09:00 ata as 19:00", { exact: false }))
    .toBeVisible();
});
