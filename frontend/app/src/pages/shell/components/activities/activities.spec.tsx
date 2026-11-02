// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, test, expect } from "vitest";
import { page, commands } from "vitest/browser";
import { render } from "vitest-browser-react";
import { stubJsonResponse } from "@frontend-testing/server-stubs";
import { App } from "@/components/app/app.view";
import { facility, stubFacilities, stubShell } from "@/test/fixtures";
import type { PublicActivity, PublicActivityDetails } from "@/types/models";
const swimming: PublicActivity = {
  id: "60000000-0000-4000-8000-000000000011",
  facilityId: facility.id,
  facilityName: facility.name,
  facilityAddress: "Rúa do Río, 5",
  resourceId: facility.id,
  resourceName: "Rúa 2",
  sport: "swimming",
  sportName: { gl: "Natación", es: "Natación" },
  sportArt: "swimming",
  name: { gl: "Natación infantil", es: "Natación infantil" },
  description: { gl: "Iniciación para nenas e nenos.", es: "" },
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
  prices: [
    { category: "general", priceCents: 3000 },
    { category: "resident", priceCents: 1500 },
  ],
  status: "published",
  cancellationReason: null,
  nextSession: "2026-11-03T16:00:00Z",
  enrolment: "open",
};
const details: PublicActivityDetails = {
  ...swimming,
  sessions: [
    {
      id: "61000000-0000-4000-8000-000000000001",
      start: "2026-11-03T16:00:00Z",
      end: "2026-11-03T17:00:00Z",
      status: "cancelled",
      cancellationReason: "Avaría na depuradora",
    },
    {
      id: "61000000-0000-4000-8000-000000000002",
      start: "2026-11-05T16:00:00Z",
      end: "2026-11-05T17:00:00Z",
      status: "active",
      cancellationReason: null,
    },
  ],
};
describe("Activities and sports schools", () => {
  test("should list the activities and send the filters to the server", async () => {
    stubShell();
    stubFacilities([facility]);
    const { spy } = stubJsonResponse({
      path: "*/v2/public/activities",
      response: { items: [swimming], total: 1, page: 1, pageSize: 12 },
    });
    await commands.navigate("/app/vilaverde/actividades");
    await render(<App />);
    await expect
      .element(
        page.getByRole("heading", {
          name: "Actividades e escolas deportivas",
          level: 1,
        }),
      )
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Natación infantil" }))
      .toHaveAttribute(
        "href",
        `/app/vilaverde/actividades/${swimming.id}`,
      );
    await expect
      .element(page.getByText("martes e xoves, 17:00–18:00"))
      .toBeVisible();
    await expect.element(page.getByText("De 6 a 12 anos")).toBeVisible();
    await expect.element(page.getByText("1 actividade")).toBeVisible();
    await page.getByRole("checkbox", { name: "Só con inscrición aberta" }).click();
    await page
      .getByRole("spinbutton", { name: "Idade de quen vai participar" })
      .fill("9");
    await expect
      .poll(() => new URL(spy.mock.lastCall![0].url).searchParams.get("age"))
      .toBe("9");
    const params = new URL(spy.mock.lastCall![0].url).searchParams;
    expect(params.get("open")).toBe("true");
    expect(params.get("slug")).toBe("vilaverde");
  });
  test("should show an activity's schedule, prices and cancelled sessions", async () => {
    stubShell();
    stubFacilities([facility]);
    stubJsonResponse({
      path: "*/v2/public/activities/:id",
      response: details,
    });
    await commands.navigate(`/app/vilaverde/actividades/${swimming.id}`);
    await render(<App />);
    await expect
      .element(page.getByRole("heading", { name: "Natación infantil", level: 1 }))
      .toBeVisible();
    await expect
      .element(page.getByRole("link", { name: facility.name }))
      .toHaveAttribute("href", `/app/vilaverde/instalacions/${facility.id}`);
    await expect
      .element(page.getByText("Anulada: Avaría na depuradora"))
      .toBeVisible();
    await expect.element(page.getByText("Persoa empadroada")).toBeVisible();
    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect
      .element(page.getByText("martes y jueves, 17:00–18:00"))
      .toBeVisible();
  });
});
