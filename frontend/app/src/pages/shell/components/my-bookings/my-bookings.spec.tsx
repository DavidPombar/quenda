// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { facility, stubShell } from "@/test/fixtures";
describe("My bookings notices", () => {
  test("should list a booking reminder among the notices", async () => {
    stubShell(true);
    stubJsonResponse({ path: "*/v2/citizen/bookings", response: [] });
    stubJsonResponse({
      path: "*/v2/citizen/notifications",
      response: [
        {
          id: "30000000-0000-4000-8000-000000000001",
          bookingId: "40000000-0000-4000-8000-000000000001",
          kind: "reminder",
          facilityName: facility.name,
          createdAt: "2026-10-20T08:00:00Z",
        },
      ],
    });
    await commands.navigate("/app/vilaverde/reservas");
    await render(<App />);
    await expect
      .element(page.getByText("Lembranza da reserva", { exact: true }))
      .toBeVisible();
  });
});
