// SPDX-License-Identifier: AGPL-3.0-or-later
import { test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { facility, stubShell } from "@/test/fixtures";
const booking = {
  id: "30000000-0000-4000-8000-000000000001",
  facilityId: facility.id,
  facilityName: facility.name,
  sport: facility.sport,
  start: "2099-10-20T08:00:00Z",
  end: "2099-10-20T09:00:00Z",
  status: "confirmed",
};
const token = "a".repeat(64);
function stubBookings(feed: { active: boolean; createdAt: string | null }) {
  stubShell(true);
  stubJsonResponse({ path: "*/v2/citizen/bookings", response: [booking] });
  stubJsonResponse({ path: "*/v2/citizen/notifications", response: [] });
  stubJsonResponse({ path: "*/v2/citizen/calendar-feed", response: feed });
}
test("should offer each confirmed reservation as an iCalendar download", async () => {
  stubBookings({ active: false, createdAt: null });
  await commands.navigate("/app/vilaverde/reservas");
  await render(<App />);
  await expect
    .element(page.getByRole("link", { name: "Engadir ao calendario" }))
    .toHaveAttribute("href", `/v2/citizen/bookings/${booking.id}/calendar.ics`);
});
test("should show the subscription link once when a person creates it", async () => {
  stubBookings({ active: false, createdAt: null });
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
  stubBookings({ active: true, createdAt: "2026-10-18T08:00:00Z" });
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
